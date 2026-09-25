import { ArrowLeftRight, Check, GitBranch, Repeat } from "lucide-react";
import type { MathNode } from "mathjs";
import { useMemo, type ReactNode } from "react";
import { depthOf, hasBranches, loopOf, pathTo, transpositionsOf, type Exploration } from "../engine/exploration";
import { useTex } from "./display";
import { Tex } from "./Tex";

interface Props {
  exploration: Exploration;
  isGoal?: (node: MathNode) => boolean;
  locked?: boolean;
  onJump: (id: number) => void;
}

/**
 * Every line explored, as an analysis board's move list: the line you are on reads straight
 * down, and the alternatives tried at each step hang off it, indented.
 */
export function LinesPane({ exploration: ex, isGoal, locked, onJump }: Props) {
  const tex = useTex();
  const onLine = useMemo(() => new Set(pathTo(ex)), [ex]);
  if (!hasBranches(ex)) return null;

  const row = (id: number) => {
    const node = ex.nodes[id];
    const here = id === ex.current;
    const loop = loopOf(ex, id);
    const trans = loop === null ? transpositionsOf(ex, id) : [];
    return (
      <button
        key={`row-${id}`}
        onClick={() => onJump(id)}
        disabled={locked}
        className={`flex w-full min-w-0 items-center gap-2 rounded px-2 py-1 text-left font-mono text-xs transition disabled:cursor-default ${
          here ? "bg-cyan-400/10 text-cyan-100" : onLine.has(id) ? "text-cyan-200/80 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
        }`}
      >
        <span className="w-5 shrink-0 text-right text-slate-500">{depthOf(ex, id)}</span>
        <span className="w-24 shrink-0 truncate sm:w-36" title={node.state.appliedTacticName ?? undefined}>
          {node.state.appliedTacticName ?? "Start"}
        </span>
        <span className="min-w-0 flex-1 overflow-hidden text-sm whitespace-nowrap">
          <Tex latex={tex(node.state.exprNode)} />
        </span>
        {isGoal?.(node.state.exprNode) && <Check size={13} className="shrink-0 text-emerald-400" aria-label="reaches the goal" />}
        {loop !== null && (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-amber-300" title={`Loop: same expression as step ${depthOf(ex, loop)}`}>
            <Repeat size={12} /> {depthOf(ex, loop)}
          </span>
        )}
        {trans.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-0.5 text-slate-400"
            title={`Also reached on another line, at step ${trans.map((t) => depthOf(ex, t)).join(", ")}`}
          >
            <ArrowLeftRight size={12} /> {depthOf(ex, trans[0])}
          </span>
        )}
        {here && <span className="shrink-0 text-cyan-300">◀</span>}
      </button>
    );
  };

  // The continuation of `parent`: its main move, the alternatives to that move, then onward.
  const continuation = (parent: number): ReactNode[] => {
    const out: ReactNode[] = [];
    for (let p = parent; ex.nodes[p].children.length; ) {
      const kids = ex.nodes[p].children;
      const main = kids.find((k) => onLine.has(k)) ?? kids[0];
      out.push(row(main));
      for (const alt of kids.filter((k) => k !== main)) {
        out.push(
          <div key={`alt-${alt}`} className="my-0.5 ml-5 border-l border-slate-700 pl-2">
            {row(alt)}
            {continuation(alt)}
          </div>,
        );
      }
      p = main;
    }
    return out;
  };

  return (
    <section className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <h3 className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-slate-500 uppercase">
        <GitBranch size={13} /> Lines
        <span className="normal-case tracking-normal text-slate-600">
          · {ex.nodes.filter((n) => !n.children.length).length} explored{locked ? "" : " · click a step to go there"}
        </span>
      </h3>
      <div className="overflow-x-auto">
        {row(0)}
        {continuation(0)}
      </div>
    </section>
  );
}
