import { useCallback, useEffect, useRef, useState } from "react";
import type { PartFlags } from "backend/db/schema";
import { agentSettingsMessage, type CoachId, type CoachSettings } from "backend/coach-prompt";
import { NO_PARTS } from "backend/criteria";
import type { MascotState } from "@/components/Mascot";

const AGENT_URL = "wss://agent.deepgram.com/v1/agent/converse";
const LISTEN_URL = "wss://api.deepgram.com/v1/listen";
// nova-2 keeps "um" and "uh" in real mic audio; nova-3 drops most of them.
const FILLER_MODEL = "nova-2";
const OUTPUT_RATE = 24000;
const KEEPALIVE_MS = 8000;
// 32 kbps Opus keeps a 10-minute answer under Vercel's 4.5 MB request limit.
const RECORDING_BITRATE = 32000;
const CELEBRATE_MS = 2500;
const RECONNECT_GREETING = "Sorry, we lost the line for a second. Go ahead and pick up where you left off.";

const CAPTURE_WORKLET = `
class Capture extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Int16Array(2048); this.length = 0; }
  process(inputs) {
    const channel = inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      this.buffer[this.length++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.length === this.buffer.length) {
        this.port.postMessage(this.buffer.buffer.slice(0));
        this.length = 0;
      }
    }
    return true;
  }
}
registerProcessor("capture", Capture);`;

export type Phase = "permission" | "connecting" | "live";
export type VoiceErrorKind = "mic-denied" | "token" | "lost" | "paywall";
export type Line = { role: "coach" | "user"; text: string };
export type Caption = { role: "coach" | "user"; text: string } | null;

type Session = {
  stream: MediaStream;
  input: AudioContext;
  output: AudioContext;
  micAnalyser: AnalyserNode;
  agentAnalyser: AnalyserNode;
  recorder: MediaRecorder;
  chunks: Blob[];
  agent: WebSocket | null;
  listen: WebSocket | null;
  sources: AudioBufferSourceNode[];
  playhead: number;
  reconnected: boolean;
  ending: boolean;
};

type AgentEvent = {
  type: string;
  role?: "user" | "assistant";
  content?: string;
  description?: string;
  functions?: { id: string; name: string; arguments: string }[];
};

type ListenEvent = {
  type: string;
  is_final?: boolean;
  duration?: number;
  channel?: { alternatives: { transcript: string }[] };
};

function rms(analyser: AnalyserNode, samples: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.min(1, Math.sqrt(sum / samples.length) * 4);
}

class TokenError extends Error {
  constructor(
    message: string,
    readonly paywall: boolean,
  ) {
    super(message);
  }
}

async function fetchToken(reconnect = false): Promise<string> {
  const params = new URLSearchParams({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
  if (reconnect) params.set("reconnect", "1");
  const response = await fetch(`/api/voice/token?${params}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) {
    throw new TokenError(data.error ?? "Couldn't connect to your coach. Try again.", Boolean(data.paywall));
  }
  return data.token;
}

function toParts(args: string): PartFlags {
  try {
    const parsed = JSON.parse(args) as Record<string, unknown>;
    return { s: parsed.p1 === true, t: parsed.p2 === true, a: parsed.p3 === true, r: parsed.p4 === true };
  } catch {
    return NO_PARTS;
  }
}

export function useVoiceAgent({ settings, labels, coach }: { settings: CoachSettings; labels: string[]; coach: CoachId }) {
  const [phase, setPhase] = useState<Phase>("permission");
  const [mood, setMood] = useState<MascotState>("listening");
  const [paused, setPaused] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState<{ kind: VoiceErrorKind; message: string } | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [caption, setCaption] = useState<Caption>(null);
  const [userText, setUserText] = useState("");
  const [interim, setInterim] = useState("");
  const [parts, setParts] = useState<PartFlags>(NO_PARTS);
  const [speakingSec, setSpeakingSec] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const session = useRef<Session | null>(null);
  const levelRef = useRef(0);
  const agentLevelRef = useRef(0);
  const moodRef = useRef<MascotState>("listening");
  const pausedRef = useRef(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const doneSpeakingRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const celebrateRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectRef = useRef<(token: string) => void>(() => {});

  const changeMood = useCallback((next: MascotState) => {
    moodRef.current = next;
    if (!pausedRef.current) setMood(next);
  }, []);

  const stopPlayback = useCallback(() => {
    const s = session.current;
    if (!s) return;
    s.sources.forEach((source) => source.stop());
    s.sources = [];
    s.playhead = 0;
    clearTimeout(doneSpeakingRef.current);
  }, []);

  const playChunk = useCallback((data: ArrayBuffer) => {
    const s = session.current;
    if (!s || pausedRef.current) return;
    if (moodRef.current !== "talking") changeMood("talking");
    const pcm = new Int16Array(data);
    const buffer = s.output.createBuffer(1, pcm.length, OUTPUT_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000;
    const source = s.output.createBufferSource();
    source.buffer = buffer;
    source.connect(s.agentAnalyser);
    const startAt = Math.max(s.playhead, s.output.currentTime);
    source.start(startAt);
    s.playhead = startAt + buffer.duration;
    s.sources.push(source);
    source.onended = () => {
      s.sources = s.sources.filter((item) => item !== source);
    };
  }, [changeMood]);

  const handleAgentEvent = useCallback(
    (event: AgentEvent) => {
      const s = session.current;
      switch (event.type) {
        case "SettingsApplied":
          setPhase("live");
          changeMood("listening");
          break;
        case "UserStartedSpeaking":
          stopPlayback();
          changeMood("listening");
          break;
        case "AgentThinking":
          changeMood("thinking");
          break;
        case "AgentStartedSpeaking":
          clearTimeout(doneSpeakingRef.current);
          changeMood("talking");
          break;
        case "AgentAudioDone": {
          const remaining = s ? Math.max(0, s.playhead - s.output.currentTime) : 0;
          doneSpeakingRef.current = setTimeout(() => changeMood("listening"), remaining * 1000);
          break;
        }
        case "ConversationText":
          if (!event.content) break;
          setLines((current) => [...current, { role: event.role === "user" ? "user" : "coach", text: event.content! }]);
          if (event.role === "assistant") setCaption({ role: "coach", text: event.content });
          break;
        case "FunctionCallRequest":
          for (const call of event.functions ?? []) {
            if (call.name === "update_progress") {
              const heard = toParts(call.arguments);
              setParts((current) => ({ s: current.s || heard.s, t: current.t || heard.t, a: current.a || heard.a, r: current.r || heard.r }));
            }
            if (call.name === "suggest_end") {
              setCelebrating(true);
              clearTimeout(celebrateRef.current);
              celebrateRef.current = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
            }
            s?.agent?.send(JSON.stringify({ type: "FunctionCallResponse", id: call.id, name: call.name, content: "ok" }));
          }
          break;
        case "Error":
          console.error("Voice agent error:", event.description);
          break;
      }
    },
    [changeMood, stopPlayback],
  );

  const handleListenEvent = useCallback((event: ListenEvent) => {
    if (event.type !== "Results") return;
    const transcript = event.channel?.alternatives[0]?.transcript.trim() ?? "";
    if (!transcript) return;
    if (event.is_final) {
      setUserText((current) => `${current} ${transcript}`.trim());
      setSpeakingSec((current) => current + (event.duration ?? 0));
      setInterim("");
    } else {
      setInterim(transcript);
    }
    setCaption({ role: "user", text: transcript });
  }, []);

  const openSockets = useCallback(
    (token: string, greeting: string | null) => {
      const s = session.current;
      if (!s) return;
      const sampleRate = s.input.sampleRate;

      const agent = new WebSocket(AGENT_URL, ["bearer", token]);
      agent.binaryType = "arraybuffer";
      agent.onopen = () => agent.send(JSON.stringify(agentSettingsMessage(settings, labels, sampleRate, greeting, coach)));
      agent.onmessage = (message) => {
        if (typeof message.data === "string") handleAgentEvent(JSON.parse(message.data));
        else playChunk(message.data);
      };
      agent.onclose = () => {
        if (s.ending || s.agent !== agent) return;
        stopPlayback();
        if (!s.reconnected) {
          s.reconnected = true;
          fetchToken(true)
            .then((fresh) => reconnectRef.current(fresh))
            .catch(() => setError({ kind: "lost", message: "Connection lost. Your answer so far is saved." }));
        } else {
          setError({ kind: "lost", message: "Connection lost. Your answer so far is saved." });
        }
      };

      const params = new URLSearchParams({
        model: FILLER_MODEL,
        language: "en",
        encoding: "linear16",
        sample_rate: String(sampleRate),
        interim_results: "true",
        filler_words: "true",
        smart_format: "true",
      });
      s.listen?.close();
      const listen = new WebSocket(`${LISTEN_URL}?${params}`, ["bearer", token]);
      listen.onmessage = (message) => handleListenEvent(JSON.parse(message.data));

      s.agent = agent;
      s.listen = listen;
    },
    [settings, labels, coach, handleAgentEvent, handleListenEvent, playChunk, stopPlayback],
  );

  useEffect(() => {
    reconnectRef.current = (token) => openSockets(token, RECONNECT_GREETING);
  }, [openSockets]);

  const sendAudio = useCallback((frame: ArrayBuffer) => {
    const s = session.current;
    if (!s || pausedRef.current) return;
    if (s.agent?.readyState === WebSocket.OPEN) s.agent.send(frame);
    if (s.listen?.readyState === WebSocket.OPEN) s.listen.send(frame);
  }, []);

  const teardown = useCallback(() => {
    const s = session.current;
    if (!s) return;
    s.ending = true;
    clearInterval(keepAliveRef.current);
    clearTimeout(doneSpeakingRef.current);
    clearTimeout(celebrateRef.current);
    s.agent?.close();
    s.listen?.close();
    s.stream.getTracks().forEach((track) => track.stop());
    s.input.close();
    s.output.close();
    session.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError({ kind: "mic-denied", message: "Your microphone is blocked." });
      return;
    }

    setPhase("connecting");
    changeMood("thinking");
    const input = new AudioContext();
    const output = new AudioContext({ sampleRate: OUTPUT_RATE });
    const micAnalyser = input.createAnalyser();
    const agentAnalyser = output.createAnalyser();
    agentAnalyser.connect(output.destination);
    const micSource = input.createMediaStreamSource(stream);
    micSource.connect(micAnalyser);

    await input.audioWorklet.addModule(URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: "application/javascript" })));
    const worklet = new AudioWorkletNode(input, "capture");
    const silent = input.createGain();
    silent.gain.value = 0;
    micSource.connect(worklet).connect(silent).connect(input.destination);
    worklet.port.onmessage = (message) => sendAudio(message.data);

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: RECORDING_BITRATE });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.start(1000);

    session.current = { stream, input, output, micAnalyser, agentAnalyser, recorder, chunks, agent: null, listen: null, sources: [], playhead: 0, reconnected: false, ending: false };

    try {
      openSockets(await fetchToken(), settings.greeting);
    } catch (err) {
      teardown();
      setPhase("permission");
      const message = err instanceof Error ? err.message : "Couldn't connect to your coach.";
      setError({ kind: err instanceof TokenError && err.paywall ? "paywall" : "token", message });
    }
  }, [changeMood, openSockets, sendAudio, settings.greeting, teardown]);

  const retry = useCallback(async () => {
    const s = session.current;
    if (!s) return start();
    setError(null);
    try {
      openSockets(await fetchToken(true), RECONNECT_GREETING);
    } catch (err) {
      setError({ kind: "lost", message: err instanceof Error ? err.message : "Connection lost. Your answer so far is saved." });
    }
  }, [openSockets, start]);

  const pause = useCallback(() => {
    const s = session.current;
    if (!s) return;
    pausedRef.current = true;
    setPaused(true);
    setMood("sleeping");
    stopPlayback();
    if (s.recorder.state === "recording") s.recorder.pause();
    const keepAlive = JSON.stringify({ type: "KeepAlive" });
    keepAliveRef.current = setInterval(() => {
      if (s.agent?.readyState === WebSocket.OPEN) s.agent.send(keepAlive);
      if (s.listen?.readyState === WebSocket.OPEN) s.listen.send(keepAlive);
    }, KEEPALIVE_MS);
  }, [stopPlayback]);

  const resume = useCallback(() => {
    const s = session.current;
    clearInterval(keepAliveRef.current);
    pausedRef.current = false;
    setPaused(false);
    moodRef.current = "listening";
    setMood("listening");
    if (s?.recorder.state === "paused") s.recorder.resume();
  }, []);

  const end = useCallback(async (): Promise<{ audio: Blob; mimeType: string } | null> => {
    const s = session.current;
    if (!s) return null;
    s.ending = true;
    const stopped = new Promise<void>((resolve) => {
      s.recorder.onstop = () => resolve();
    });
    if (s.recorder.state !== "inactive") s.recorder.stop();
    await stopped;
    const mimeType = s.recorder.mimeType || "audio/webm";
    const audio = new Blob(s.chunks, { type: mimeType });
    teardown();
    return { audio, mimeType };
  }, [teardown]);

  useEffect(() => {
    if (phase !== "live" || paused) return;
    const id = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== "live") return;
    const micSamples = new Float32Array(1024);
    const agentSamples = new Float32Array(1024);
    let frame = 0;
    const tick = () => {
      const s = session.current;
      if (s) {
        const mic = rms(s.micAnalyser, micSamples);
        agentLevelRef.current = rms(s.agentAnalyser, agentSamples);
        levelRef.current = moodRef.current === "talking" ? agentLevelRef.current : mic;
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => teardown, [teardown]);

  const userAnswer = [userText, interim].filter(Boolean).join(" ");
  const displayMood: MascotState = paused ? "sleeping" : celebrating ? "celebrating" : phase === "connecting" ? "thinking" : mood;

  return {
    phase,
    mood: displayMood,
    paused,
    error,
    lines,
    caption,
    userAnswer,
    interim,
    parts,
    speakingSec: Math.round(speakingSec),
    elapsed,
    levelRef,
    agentLevelRef,
    start,
    pause,
    resume,
    end,
    retry,
  };
}
