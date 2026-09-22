import type { MathNode } from "mathjs";
import { ChevronRight } from "lucide-react";
import { getAt, isConst, isOp, isRecip, isSym } from "../engine/ast";
import { toLatex } from "../engine/latex";
import type { NodePath } from "../types/tactic";
import { Tex } from "./Tex";

function kind(n: MathNode): string {
  if (isConst(n)) return "number";
  if (isSym(n)) return "variable";
  if (isRecip(n)) return "reciprocal";
  if (isOp(n)) {
    return (
      { add: "sum", subtract: "difference", multiply: "product", divide: "quotient", unaryMinus: "negation", pow: "power", equal: "equation" } as const
    )[n.fn];
  }
  return "expression";
}

/** Breadcrumb from the whole expression down to the selection; every crumb is clickable. */
export function SelectionPath({ root, focus, onSelect }: { root: MathNode; focus: NodePath; onSelect: (p: NodePath) => void }) {
  const crumbs = Array.from({ length: focus.length + 1 }, (_, i) => focus.slice(0, i));
  return (
    <nav className="flex min-w-0 flex-wrap items-center gap-0.5" aria-label="Selection">
      {crumbs.map((p, i) => {
        const node = getAt(root, p)!;
        const last = i === crumbs.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-0.5">
            {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
            <button
              onClick={() => onSelect(p)}
              className={`rounded px-1.5 py-0.5 ${
                last ? "bg-cyan-400/15 text-sm text-cyan-100" : "font-mono text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title={last ? "Current selection" : `Select this ${kind(node)}`}
            >
              {last ? <Tex latex={toLatex(node)} /> : i === 0 ? `whole ${kind(node)}` : kind(node)}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
