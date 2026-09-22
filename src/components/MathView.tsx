import type { MathNode } from "mathjs";
import { useMemo, useRef, useState } from "react";
import { pathEquals } from "../engine/ast";
import { decodePath } from "../engine/latex";
import type { NodePath } from "../types/tactic";
import { useTex } from "./display";
import { renderTex } from "./Tex";

interface Props {
  expr: MathNode;
  focus: NodePath;
  onSelect: (path: NodePath) => void;
}

const isPrefix = (prefix: NodePath, path: NodePath) =>
  prefix.length <= path.length && prefix.every((v, i) => v === path[i]);

/** Lowest common ancestor of two nodes = their longest common path prefix. */
function commonAncestor(a: NodePath, b: NodePath): NodePath {
  const out: NodePath = [];
  for (let i = 0; i < Math.min(a.length, b.length) && a[i] === b[i]; i++) out.push(a[i]);
  return out;
}

function pathAt(x: number, y: number): NodePath | null {
  const el = document.elementFromPoint(x, y)?.closest(".am-interactive [data-path]");
  return el ? decodePath(el.getAttribute("data-path")!) : null;
}

/**
 * The active step. Selection gestures:
 * - click a term to select it; click the same spot again to widen to the enclosing expression,
 * - drag from one term to another to select the smallest expression containing both.
 */
export function MathView({ expr, focus, onSelect }: Props) {
  const [dragStart, setDragStart] = useState<NodePath | null>(null);
  const [dragPreview, setDragPreview] = useState<NodePath | null>(null);
  const lastClick = useRef<NodePath | null>(null);

  const tex = useTex();
  const shown = dragPreview ?? focus;
  const html = useMemo(() => renderTex(tex(expr, { interactive: true, focus: shown }), true), [tex, expr, shown]);

  const click = (p: NodePath) => {
    const repeat = lastClick.current && pathEquals(lastClick.current, p);
    lastClick.current = p;
    // Repeated click inside the current selection widens it one level; past the root, start over.
    if (repeat && isPrefix(focus, p) && focus.length > 0) onSelect(focus.slice(0, -1));
    else onSelect(p);
  };

  return (
    <div
      className="am-interactive overflow-x-auto py-3 text-3xl select-none touch-none"
      onPointerDown={(e) => {
        const p = pathAt(e.clientX, e.clientY);
        if (!p) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragStart(p);
      }}
      onPointerMove={(e) => {
        if (!dragStart) return;
        const p = pathAt(e.clientX, e.clientY);
        if (!p) return;
        const lca = pathEquals(p, dragStart) ? null : commonAncestor(dragStart, p);
        setDragPreview((prev) => (prev && lca && pathEquals(prev, lca) ? prev : lca));
      }}
      onPointerUp={(e) => {
        if (!dragStart) return;
        const p = pathAt(e.clientX, e.clientY) ?? dragStart;
        if (pathEquals(p, dragStart)) {
          click(p);
        } else {
          lastClick.current = null;
          onSelect(commonAncestor(dragStart, p));
        }
        setDragStart(null);
        setDragPreview(null);
      }}
      onPointerCancel={() => {
        setDragStart(null);
        setDragPreview(null);
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
