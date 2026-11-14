import type { Ref } from "react";

export type MascotState = "listening" | "thinking" | "talking" | "celebrating" | "sleeping";

type Props = {
  state: MascotState;
  size: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

const ACCENT = "#7C5CFF";
const INK = "#0B0B0F";
const MOUTH = "#1A0F3D";
const TONGUE = "#B9A8FF";

export function Mascot({ state, size, className = "", ref }: Props) {
  return (
    <div ref={ref} className={`ym m-${state} ${className}`} style={{ width: size }}>
      <svg viewBox="0 0 240 240" role="img" aria-label={`Coach is ${state}`}>
        <ellipse cx="116" cy="224" rx="58" ry="7" fill={ACCENT} opacity="0.16" />
        <g className="ym-body">
          <path d="M120 50 C120 38 125 30 132 26" fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" />
          <circle className="ym-dot" cx="134" cy="24" r="7.5" fill={ACCENT} />
          <path
            d="M108 50 H132 A60 60 0 0 1 192 110 V126 A60 60 0 0 1 132 186 H102 L68 210 L78 178 A60 60 0 0 1 48 126 V110 A60 60 0 0 1 108 50 Z"
            fill={ACCENT}
          />
          <ellipse cx="88" cy="76" rx="24" ry="10" fill="#FFFFFF" opacity="0.2" transform="rotate(-24 88 76)" />
          <g className="ym-face">
            <ellipse cx="76" cy="142" rx="11" ry="6.5" fill="#FFFFFF" opacity="0.2" />
            <ellipse cx="164" cy="142" rx="11" ry="6.5" fill="#FFFFFF" opacity="0.2" />
            <g className="e-open">
              <g className="ym-eye">
                <ellipse cx="96" cy="112" rx="16" ry="19" fill="#FFFFFF" />
                <g className="ym-pupils">
                  <circle cx="98" cy="116" r="8.5" fill={INK} />
                  <circle cx="101" cy="112" r="2.8" fill="#FFFFFF" />
                </g>
              </g>
              <g className="ym-eye r">
                <ellipse cx="144" cy="112" rx="16" ry="19" fill="#FFFFFF" />
                <g className="ym-pupils">
                  <circle cx="146" cy="116" r="8.5" fill={INK} />
                  <circle cx="149" cy="112" r="2.8" fill="#FFFFFF" />
                </g>
              </g>
            </g>
            <g className="e-happy">
              <path d="M82 118 Q96 100 110 118" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
              <path d="M130 118 Q144 100 158 118" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
            </g>
            <g className="e-closed">
              <path d="M82 112 Q96 124 110 112" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
              <path d="M130 112 Q144 124 158 112" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            </g>
            <g className="mo-smile">
              <path d="M107 146 Q120 157 133 146" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            </g>
            <g className="mo-talk">
              <g className="ym-mouth">
                <ellipse cx="120" cy="150" rx="13" ry="11" fill={MOUTH} />
                <ellipse cx="120" cy="156" rx="7" ry="3.5" fill={TONGUE} />
              </g>
            </g>
            <g className="mo-hmm">
              <path d="M110 151 Q119 147 131 152" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            </g>
            <g className="mo-grin">
              <path d="M101 141 H139 Q139 168 120 168 Q101 168 101 141 Z" fill={MOUTH} />
              <ellipse cx="120" cy="161" rx="9" ry="4.5" fill={TONGUE} />
            </g>
            <g className="mo-o">
              <circle cx="120" cy="150" r="5" fill={MOUTH} />
            </g>
          </g>
        </g>
        <g className="x-dots">
          <circle cx="198" cy="56" r="5" fill={ACCENT} />
          <circle cx="212" cy="40" r="6.5" fill={ACCENT} />
          <circle cx="228" cy="22" r="8" fill={ACCENT} />
        </g>
        <g className="x-zzz" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fill={ACCENT}>
          <text x="190" y="58" fontSize="16">z</text>
          <text x="204" y="42" fontSize="20">z</text>
          <text x="218" y="24" fontSize="24">Z</text>
        </g>
        <g className="x-spark">
          <g><path d="M30 52 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill={ACCENT} /></g>
          <g><path d="M206 60 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill={TONGUE} /></g>
          <g><path d="M18 146 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill={TONGUE} /></g>
          <g><path d="M222 148 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill={ACCENT} /></g>
          <g><path d="M170 14 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5 z" fill={ACCENT} /></g>
        </g>
      </svg>
    </div>
  );
}
