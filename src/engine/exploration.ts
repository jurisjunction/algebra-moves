import type { State } from "../types/tactic";
import { structKey } from "./ast";

/**
 * Move history as a tree of lines, like a chess analysis board: going back never discards the
 * line you tried, and a move from an earlier position starts a new branch.
 */
export interface LineNode {
  id: number;
  parent: number | null;
  state: State;
  /** Structural key of the expression, for spotting loops and transpositions. */
  key: string;
  children: number[];
}

export interface Exploration {
  /** Indexed by id; the root is 0. */
  nodes: LineNode[];
  current: number;
}

export function explore(start: State): Exploration {
  return { nodes: [{ id: 0, parent: null, state: start, key: structKey(start.exprNode), children: [] }], current: 0 };
}

/**
 * Play a move from the current node. Repeating a move already explored from here revisits
 * that branch instead of duplicating it.
 */
export function extend(ex: Exploration, state: State): Exploration {
  const key = structKey(state.exprNode);
  const here = ex.nodes[ex.current];
  const existing = here.children.find((c) => ex.nodes[c].key === key);
  if (existing !== undefined) return { ...ex, current: existing };
  const id = ex.nodes.length;
  const nodes = ex.nodes.map((n) => (n.id === here.id ? { ...n, children: [...n.children, id] } : n));
  nodes.push({ id, parent: here.id, state, key, children: [] });
  return { nodes, current: id };
}

export const moveTo = (ex: Exploration, id: number): Exploration => (ex.nodes[id] && id !== ex.current ? { ...ex, current: id } : ex);

export const back = (ex: Exploration): Exploration => {
  const parent = ex.nodes[ex.current].parent;
  return parent === null ? ex : { ...ex, current: parent };
};

/** Node ids from the root to `id`. */
export function pathTo(ex: Exploration, id = ex.current): number[] {
  const ids: number[] = [];
  for (let n: number | null = id; n !== null; n = ex.nodes[n].parent) ids.push(n);
  return ids.reverse();
}

/** The states from the root to `id`: the linear history the rest of the app works on. */
export const lineTo = (ex: Exploration, id = ex.current): State[] => pathTo(ex, id).map((n) => ex.nodes[n].state);

export const depthOf = (ex: Exploration, id: number): number => pathTo(ex, id).length - 1;

/** The nearest ancestor holding the same expression: this line has come back to it. */
export function loopOf(ex: Exploration, id = ex.current): number | null {
  const node = ex.nodes[id];
  for (let n = node.parent; n !== null; n = ex.nodes[n].parent) if (ex.nodes[n].key === node.key) return n;
  return null;
}

/**
 * Other lines that reached the same expression. Ancestors and descendants are excluded: a
 * repeat along one line is a loop, reported by `loopOf`.
 */
export function transpositionsOf(ex: Exploration, id: number): number[] {
  const line = new Set(pathTo(ex, id));
  const key = ex.nodes[id].key;
  return ex.nodes.filter((n) => n.key === key && !line.has(n.id) && !pathTo(ex, n.id).includes(id)).map((n) => n.id);
}

export const hasBranches = (ex: Exploration): boolean => ex.nodes.some((n) => n.children.length > 1);
