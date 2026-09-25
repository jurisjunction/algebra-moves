import { AlertTriangle, CornerUpLeft, Repeat, Trophy, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { NodePath, State } from "../types/tactic";
import { MathView } from "./MathView";
import { SelectionPath } from "./SelectionPath";
import { useTex } from "./display";
import { MathText, Tex } from "./Tex";

interface Props {
  history: State[];
  focus: NodePath;
  diagnostic: string | null;
  /** The earlier step the current expression repeats, if the line has looped. */
  loopStep: number | null;
  solved: boolean;
  /** When true, the latest step is not interactive (e.g. the problem is finished). */
  locked?: boolean;
  onSelect: (path: NodePath) => void;
  /** Go back to an earlier step; the steps after it stay available as a line. */
  onJumpToStep: (step: number) => void;
  onDismissDiagnostic: () => void;
}

export function HistoryPane({ history, focus, diagnostic, loopStep, solved, locked, onSelect, onJumpToStep, onDismissDiagnostic }: Props) {
  const tex = useTex();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [history.length]);

  return (
    <ol className="space-y-2">
      {history.map((s, i) => {
        const active = i === history.length - 1;
        const interactive = active && !locked;
        return (
          <li
            key={i}
            className={`rounded-lg border px-4 py-3 ${
              active
                ? solved
                  ? "border-emerald-400/50 bg-emerald-950/30 shadow-[0_0_24px_-8px_rgb(52_211_153/0.5)]"
                  : "border-cyan-400/40 bg-slate-900/80 shadow-[0_0_24px_-10px_rgb(34_211_238/0.6)]"
                : "border-slate-800 bg-slate-900/40"
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <span
                className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 font-semibold ${
                  active ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                {i}
              </span>
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                {s.appliedTacticName ? `Step ${i}: ${s.appliedTacticName}` : "Start"}
              </span>
              {s.sideConditions.length > 0 && (
                <span className="text-slate-500">
                  assuming <Tex latex={s.sideConditions.join(",\\ ")} />
                </span>
              )}
              {active && solved && (
                <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-300">
                  <Trophy size={12} /> SOLVED
                </span>
              )}
              {!active && !locked && (
                <button
                  onClick={() => onJumpToStep(i)}
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 whitespace-nowrap text-slate-500 hover:bg-slate-800 hover:text-cyan-300"
                  title="Go back to this step. The moves after it are kept as a line."
                  aria-label={`Back to step ${i}`}
                >
                  <CornerUpLeft size={12} /> <span className="hidden sm:inline">back to here</span>
                </button>
              )}
            </div>

            {interactive ? (
              <>
                <MathView expr={s.exprNode} focus={focus} onSelect={onSelect} />
                <div className="flex items-center gap-2 border-t border-slate-800 pt-2 text-xs text-slate-500">
                  <span className="shrink-0 font-mono">SEL</span>
                  <SelectionPath root={s.exprNode} focus={focus} onSelect={onSelect} />
                  <span className="ml-auto hidden shrink-0 font-mono text-[11px] text-slate-600 md:inline">
                    click again to widen · drag across terms · ←↑→↓
                  </span>
                </div>
                {loopStep !== null && (
                  <div className="rise mt-2 flex flex-wrap items-center gap-2 rounded-md border border-amber-400/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
                    <Repeat size={16} className="shrink-0 text-amber-400" />
                    <p className="min-w-48 flex-1 leading-relaxed">
                      You've been here before: this is the same expression as step {loopStep} ({i - loopStep}{" "}
                      {i - loopStep === 1 ? "move" : "moves"} ago).
                    </p>
                    <button
                      onClick={() => onJumpToStep(loopStep)}
                      className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 px-2 py-0.5 font-mono text-xs text-amber-200 hover:bg-amber-400/10"
                    >
                      <CornerUpLeft size={12} /> Jump back to step {loopStep}
                    </button>
                  </div>
                )}
                {diagnostic && (
                  <div className="rise mt-2 flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                    <p className="flex-1 leading-relaxed">
                      <MathText text={diagnostic} />
                    </p>
                    <button onClick={onDismissDiagnostic} className="rounded p-0.5 text-amber-300 hover:bg-amber-400/10" aria-label="Dismiss">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={`overflow-x-auto py-1 ${active ? "text-2xl text-slate-100" : "text-lg text-slate-400"}`}>
                <Tex latex={tex(s.exprNode)} display />
              </div>
            )}
          </li>
        );
      })}
      <div ref={endRef} />
    </ol>
  );
}
