import type { MathNode } from "mathjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAt, getChildren, pathEquals } from "../engine/ast";
import { safeCanApply } from "../engine/registry";
import { back, extend, lineTo, loopOf, moveTo, pathTo, type Exploration } from "../engine/exploration";
import { applyTactic } from "../engine/transformer";
import type { NodePath, TacticParams, TacticPlugin } from "../types/tactic";
import { useTex } from "./display";
import { HistoryPane } from "./HistoryPane";
import { LinesPane } from "./LinesPane";
import { TacticDrawer } from "./TacticDrawer";

/** Keyboard shortcuts are ignored while typing (but not while a checkbox has focus). */
const TEXT_ENTRY = "textarea, select, input:not([type=checkbox]):not([type=radio])";

/** Arrow-key tree navigation: ↑ parent, ↓ first child, ←/→ previous/next sibling. */
function navigate(root: MathNode, focus: NodePath, key: string): NodePath | null {
  if (key === "ArrowUp") return focus.length ? focus.slice(0, -1) : null;
  if (key === "ArrowDown") {
    const node = getAt(root, focus);
    return node && getChildren(node).length ? [...focus, 0] : null;
  }
  if (!focus.length) return null;
  const parent = getAt(root, focus.slice(0, -1))!;
  const i = focus[focus.length - 1] + (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0);
  return i >= 0 && i < getChildren(parent).length ? [...focus.slice(0, -1), i] : null;
}

export interface WorkspaceHint {
  path: NodePath;
  tacticId: string;
}

interface Props {
  exploration: Exploration;
  /** Called after a move (with the tactic), or after going back or jumping to a line (without). */
  onExplorationChange: (exploration: Exploration, applied?: TacticPlugin) => void;
  /** The tactics the player may use. */
  tactics: TacticPlugin[];
  solved: boolean;
  /** Marks positions that reach the goal in the lines view. */
  isGoal?: (node: MathNode) => boolean;
  /** Freeze the workspace (e.g. after the problem is solved). */
  locked?: boolean;
  hint?: WorkspaceHint | null;
  drawerTitle?: string;
}

/** History + tactic drawer: the core "make a legal move" loop, shared by sandbox and campaign. */
export function Workspace({ exploration, onExplorationChange, tactics, solved, isGoal, locked, hint, drawerTitle }: Props) {
  const [focus, setFocus] = useState<NodePath>([]);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const history = useMemo(() => lineTo(exploration), [exploration]);
  const lineIds = useMemo(() => pathTo(exploration), [exploration]);
  const loop = loopOf(exploration);
  const root = history[history.length - 1].exprNode;
  const focusedNode = getAt(root, focus) ?? root;
  const tex = useTex();
  const focusLatex = useMemo(() => tex(focusedNode), [tex, focusedNode]);

  // A new problem invalidates the selection.
  const start = history[0];
  useEffect(() => {
    setFocus([]);
    setDiagnostic(null);
    setPendingId(null);
  }, [start]);

  useEffect(() => {
    if (hint) {
      setFocus(hint.path);
      setPendingId(null);
      setDiagnostic(null);
    }
  }, [hint]);

  const applicable = useMemo(
    () => new Set(tactics.filter((t) => safeCanApply(t, focusedNode, { root, path: focus })).map((t) => t.id)),
    [tactics, focusedNode, root, focus],
  );

  const select = useCallback(
    (path: NodePath) => {
      if (pathEquals(focus, path)) return;
      setFocus(path);
      setPendingId(null);
      setDiagnostic(null);
    },
    [focus],
  );

  const run = (t: TacticPlugin, params?: TacticParams): string | null => {
    if (locked) return null;
    const r = applyTactic(history, focus, t.id, params);
    if (!r.ok) return r.message;
    onExplorationChange(extend(exploration, r.state), t);
    setFocus(r.state.targetPath);
    setDiagnostic(null);
    setPendingId(null);
    return null;
  };

  const choose = (t: TacticPlugin) => {
    if (locked) return;
    if (!applicable.has(t.id)) {
      setPendingId(null);
      setDiagnostic(run(t));
      return;
    }
    if (t.paramSchema) {
      setDiagnostic(null);
      setPendingId((prev) => (prev === t.id ? null : t.id));
      return;
    }
    setDiagnostic(run(t));
  };

  const goTo = useCallback(
    (next: Exploration) => {
      if (next === exploration) return;
      onExplorationChange(next);
      setFocus([]);
      setDiagnostic(null);
      setPendingId(null);
    },
    [exploration, onExplorationChange],
  );
  const undo = useCallback(() => goTo(back(exploration)), [goTo, exploration]);
  const jump = (id: number) => {
    if (!locked) goTo(moveTo(exploration, id));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest(TEXT_ENTRY)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (!locked) undo();
      } else if (e.key === "Escape") {
        setFocus([]);
        setPendingId(null);
      } else if (e.key.startsWith("Arrow") && !locked) {
        e.preventDefault();
        const next = navigate(root, focus, e.key);
        if (next) select(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, select, root, focus, locked]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0">
        <HistoryPane
          history={history}
          focus={focus}
          diagnostic={diagnostic}
          loopStep={loop === null ? null : lineIds.indexOf(loop)}
          solved={solved}
          locked={locked}
          onSelect={select}
          onJumpToStep={(i) => jump(lineIds[i])}
          onDismissDiagnostic={() => setDiagnostic(null)}
        />
        <LinesPane exploration={exploration} isGoal={isGoal} locked={locked} onJump={jump} />
      </section>
      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:self-start">
        <TacticDrawer
          title={drawerTitle}
          tactics={tactics}
          applicable={locked ? new Set() : applicable}
          pendingId={pendingId}
          hintId={hint?.tacticId}
          target={focusedNode}
          targetLatex={focusLatex}
          onChoose={choose}
          onSubmitParams={(t, params) => run(t, params)}
          onCancelParams={() => setPendingId(null)}
        />
      </div>
    </div>
  );
}
