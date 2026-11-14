import type { Ref } from "react";
import type { MascotState } from "@/components/Mascot";

type Props = { state: MascotState; size: number; className?: string; ref?: Ref<HTMLDivElement> };

const SKIN = "#E9BE96";
const SKIN_SHADE = "#D9A97F";
const HAIR = "#4B4B52";
const FRAME = "#15151A";
const JACKET = "#17171B";
const LAPEL = "#26262C";
const TEE = "#2E2E35";
const MOUTH = "#4A1F14";
const TONGUE = "#E58A78";
const ACCENT = "#7C5CFF";

/** A flat, vector coach in a leather jacket. Shares the mascot's class names, so the same state animations apply. */
export function JensenAvatar({ state, size, className = "", ref }: Props) {
  return (
    <div ref={ref} className={`ym m-${state} ${className}`} style={{ width: size }}>
      <svg viewBox="0 0 240 240" role="img" aria-label={`Coach is ${state}`}>
        <ellipse cx="120" cy="224" rx="70" ry="7" fill={ACCENT} opacity="0.16" />
        <g className="ym-body">
          <path d="M44 216 Q44 170 84 157 L104 150 L120 178 L136 150 L156 157 Q196 170 196 216 Z" fill={JACKET} />
          <path d="M104 150 L120 178 L136 150 Z" fill={TEE} />
          <path d="M104 150 L92 158 L112 200 L120 178 Z" fill={LAPEL} />
          <path d="M136 150 L148 158 L128 200 L120 178 Z" fill={LAPEL} />
          <path d="M58 196 Q64 178 80 168" fill="none" stroke="#3A3A43" strokeWidth="3" strokeLinecap="round" />
          <rect x="104" y="132" width="32" height="22" rx="6" fill={SKIN_SHADE} />

          <g className="ym-face">
            <rect x="62" y="86" width="12" height="24" rx="6" fill={SKIN_SHADE} />
            <rect x="166" y="86" width="12" height="24" rx="6" fill={SKIN_SHADE} />
            <rect x="70" y="40" width="100" height="100" rx="28" fill={SKIN} />
            <path d="M68 86 V68 Q68 34 120 32 Q172 34 172 68 V86 Q164 60 120 58 Q78 60 68 86 Z" fill={HAIR} />

            <rect x="80" y="80" width="36" height="25" rx="9" fill="#FFFFFF" fillOpacity="0.35" stroke={FRAME} strokeWidth="5" />
            <rect x="124" y="80" width="36" height="25" rx="9" fill="#FFFFFF" fillOpacity="0.35" stroke={FRAME} strokeWidth="5" />
            <path d="M116 90 Q120 86 124 90" fill="none" stroke={FRAME} strokeWidth="4" strokeLinecap="round" />
            <path d="M80 88 H72 M160 88 H168" stroke={FRAME} strokeWidth="4" strokeLinecap="round" />

            <g className="mo-smile">
              <path d="M107 121 Q120 131 133 121" fill="none" stroke={MOUTH} strokeWidth="4.5" strokeLinecap="round" />
            </g>
            <g className="mo-talk">
              <g className="ym-mouth">
                <ellipse cx="120" cy="124" rx="11" ry="9" fill={MOUTH} />
                <ellipse cx="120" cy="129" rx="6" ry="2.6" fill={TONGUE} />
              </g>
            </g>
            <g className="mo-hmm">
              <path d="M109 126 Q119 121 131 127" fill="none" stroke={MOUTH} strokeWidth="4.5" strokeLinecap="round" />
            </g>
            <g className="mo-grin">
              <path d="M103 117 H137 Q137 138 120 138 Q103 138 103 117 Z" fill={MOUTH} />
              <ellipse cx="120" cy="132" rx="8" ry="3.5" fill={TONGUE} />
            </g>
            <g className="mo-o">
              <circle cx="120" cy="125" r="4.5" fill={MOUTH} />
            </g>
          </g>
        </g>

        <g className="x-dots">
          <circle cx="190" cy="50" r="5" fill={ACCENT} />
          <circle cx="205" cy="34" r="6.5" fill={ACCENT} />
          <circle cx="222" cy="16" r="8" fill={ACCENT} />
        </g>
        <g className="x-zzz" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fill={ACCENT}>
          <text x="184" y="52" fontSize="16">z</text>
          <text x="198" y="36" fontSize="20">z</text>
          <text x="212" y="18" fontSize="24">Z</text>
        </g>
        <g className="x-spark">
          <g><path d="M30 52 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill={ACCENT} /></g>
          <g><path d="M206 60 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#B9A8FF" /></g>
          <g><path d="M18 146 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill="#B9A8FF" /></g>
          <g><path d="M222 148 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill={ACCENT} /></g>
          <g><path d="M170 14 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5 z" fill={ACCENT} /></g>
        </g>
      </svg>
    </div>
  );
}
