import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MathNode } from "mathjs";
import { toLatex } from "../engine/latex";
import { parseProblem } from "../engine/parse";
import type { TacticPlugin, TacticParams } from "../types/tactic";
import { MathText, Tex } from "./Tex";

interface Props {
  tactic: TacticPlugin;
  target: MathNode;
  targetLatex: string;
  /** Returns an error message, or null if the move was applied. */
  onSubmit: (params: TacticParams) => string | null;
  onCancel: () => void;
}

/** Preview what a choice would produce on the actual target, falling back to the option's own LaTeX. */
function preview(tactic: TacticPlugin, target: MathNode, choice: string, fallback?: string): string | undefined {
  try {
    return toLatex(tactic.apply(target, { choice }));
  } catch {
    return fallback;
  }
}

export function ParamPopover({ tactic, target, targetLatex, onSubmit, onCancel }: Props) {
  const schema = tactic.paramSchema!;
  const [p, setP] = useState("");
  const [q, setQ] = useState("");
  const [expr, setExpr] = useState(() => tactic.paramDefaults?.(target).expr ?? "");
  const [error, setError] = useState<string | null>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  let exprPreview: string | null = null;
  if (schema.type === "expression") {
    try {
      exprPreview = toLatex(parseProblem(expr));
    } catch {
      exprPreview = null;
    }
  }

  useEffect(() => {
    firstInput.current?.focus();
  }, []);

  const submit = (params: TacticParams) => setError(onSubmit(params));

  const [before, after] = schema.prompt.split("{n}");

  return (
    <div
      className="rise rounded-md border border-cyan-400/40 bg-slate-950/70 p-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm text-slate-300">
          <span className="block font-mono text-xs font-semibold tracking-wide text-cyan-300">{tactic.name}</span>
          {before}
          {after !== undefined && <Tex latex={targetLatex} />}
          {after}
        </p>
        <button onClick={onCancel} className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200" aria-label="Cancel">
          <X size={14} />
        </button>
      </div>

      {schema.type === "factors" && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit({ p, q });
          }}
        >
          <input
            ref={firstInput}
            inputMode="numeric"
            value={p}
            onChange={(e) => setP(e.target.value)}
            className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            aria-label="First factor"
          />
          <span className="text-slate-500">×</span>
          <input
            inputMode="numeric"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            aria-label="Second factor"
          />
          <button type="submit" className="ml-auto rounded bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
            Apply
          </button>
        </form>
      )}

      {schema.type === "expression" && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit({ expr });
          }}
        >
          <input
            ref={firstInput}
            value={expr}
            onChange={(e) => {
              setExpr(e.target.value);
              setError(null);
            }}
            spellCheck={false}
            className="w-full rounded border border-slate-700 bg-slate-900 text-slate-100 px-2 py-1.5 font-mono text-sm focus:border-cyan-400 focus:outline-none"
            aria-label="Rearranged expression"
          />
          <div className="flex items-center gap-2">
            <div className="min-h-6 min-w-0 flex-1 overflow-x-auto text-slate-200">
              {exprPreview ? <Tex latex={exprPreview} /> : <span className="text-xs text-slate-400">…</span>}
            </div>
            <button type="submit" className="shrink-0 rounded bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              Apply
            </button>
          </div>
        </form>
      )}

      {schema.type === "custom" && schema.options && (
        <div className="flex flex-col gap-1.5">
          {schema.options.map((o) => (
            <button
              key={o.value}
              onClick={() => submit({ choice: o.value })}
              className="flex items-center justify-between gap-3 rounded border border-slate-700 px-3 py-1.5 text-left text-sm text-slate-200 hover:border-cyan-400 hover:bg-cyan-400/10"
            >
              <span>{o.label}</span>
              {(() => {
                const latex = preview(tactic, target, o.value, o.latex);
                return latex && <Tex latex={latex} className="text-slate-400" />;
              })()}
            </button>
          ))}
        </div>
      )}

      {schema.type === "base10" && (
        <button onClick={() => submit({})} className="rounded bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950">
          Apply
        </button>
      )}

      {error && (
        <p className="mt-2 text-xs text-rose-300">
          <MathText text={error} />
        </p>
      )}
    </div>
  );
}
