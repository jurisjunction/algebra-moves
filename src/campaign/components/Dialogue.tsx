import { ChevronsRight, FastForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MathText } from "../../components/Tex";
import type { Line, Speaker } from "../types";

/** Keyboard shortcuts are ignored while typing (but not while a checkbox has focus). */
const TEXT_ENTRY = "textarea, select, input:not([type=checkbox]):not([type=radio])";

const SPEAKER: Record<Speaker, { label: string; name: string; text: string }> = {
  SYSTEM: { label: "SYS", name: "text-cyan-400", text: "font-mono text-[13px] tracking-wide text-cyan-300/90" },
  CUSTODIAN: { label: "CUSTODIAN", name: "text-violet-300", text: "text-violet-100" },
  MOTH: { label: "MOTH", name: "text-amber-300", text: "text-amber-50/90" },
  YOU: { label: "YOU", name: "text-slate-400", text: "text-slate-300 italic" },
  ECHO: { label: "ECHO", name: "text-fuchsia-300", text: "text-fuchsia-100/90 italic" },
};

const CHARS_PER_TICK = 2;
const TICK_MS = 16;

interface Props {
  title?: string;
  subtitle?: string;
  lines: Line[];
  onDone: () => void;
  doneLabel?: string;
}

/** A terminal transcript that types out one line at a time. Click, Space or Enter to advance. */
export function Dialogue({ title, subtitle, lines, onDone, doneLabel = "Continue" }: Props) {
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const current = lines[index];
  // Math/bold markup must not be cut mid-token, so type plain characters and reveal markup at the end.
  const typing = current && chars < current.text.length;
  const finished = index >= lines.length - 1 && !typing;

  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setChars((c) => c + CHARS_PER_TICK), TICK_MS);
    return () => clearTimeout(t);
  }, [typing, chars]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [index, chars]);

  const advance = () => {
    if (typing) setChars(current.text.length);
    else if (index < lines.length - 1) {
      setIndex(index + 1);
      setChars(0);
    } else onDone();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest(TEXT_ENTRY)) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="mx-auto max-w-3xl">
      {(title || subtitle) && (
        <div className="mb-4">
          {subtitle && <p className="font-mono text-xs tracking-[0.3em] text-cyan-400/70 uppercase">{subtitle}</p>}
          {title && <h2 className="glow-cyan font-mono text-2xl font-semibold tracking-widest text-cyan-100">{title}</h2>}
        </div>
      )}
      <div
        className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/80 p-5 shadow-[inset_0_0_40px_rgb(34_211_238/0.04)]"
        onClick={advance}
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {lines.slice(0, index + 1).map((l, i) => {
            const s = SPEAKER[l.who];
            const isCurrent = i === index;
            const text = isCurrent && typing ? l.text.slice(0, chars) : l.text;
            return (
              <div key={i} className="grid grid-cols-[88px_1fr] gap-3 leading-relaxed">
                <span className={`pt-0.5 text-right font-mono text-[11px] font-semibold tracking-widest ${s.name}`}>{s.label}</span>
                <p className={`${s.text} ${isCurrent && typing ? "caret" : ""}`}>
                  {isCurrent && typing ? text.replace(/\$[^$]*\$?|\*\*/g, (m) => (m.startsWith("$") ? "…" : "")) : <MathText text={text} />}
                </p>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-xs text-slate-500">
        <span>
          {index + 1}/{lines.length} · click or press space
        </span>
        <div className="flex gap-2">
          {!finished && (
            <button
              onClick={() => {
                setIndex(lines.length - 1);
                setChars(lines[lines.length - 1].text.length);
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-slate-300"
            >
              <FastForward size={12} /> Skip
            </button>
          )}
          <button
            onClick={advance}
            className={`inline-flex items-center gap-1 rounded px-3 py-1 font-semibold ${
              finished ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300" : "border border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {finished ? doneLabel : "Next"} <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
