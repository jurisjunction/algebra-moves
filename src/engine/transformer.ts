import type { MathNode } from "mathjs";
import type { NodePath, State, TacticParams } from "../types/tactic";
import { getAt, replaceAt } from "./ast";
import { TacticError } from "./errors";
import { toLatex } from "./latex";
import { registry as defaultRegistry, safeCanApply, type TacticRegistry } from "./registry";

export type ApplyResult =
  | { ok: true; history: State[]; state: State }
  | { ok: false; message: string };

export function initialState(expr: MathNode): State {
  return { exprNode: expr, latex: toLatex(expr), appliedTacticName: null, targetPath: [], sideConditions: [] };
}

/**
 * Apply one tactic to the node at `path` in the latest state.
 * Never mutates existing states; returns a new history array on success.
 */
export function applyTactic(
  history: State[],
  path: NodePath,
  tacticId: string,
  params?: TacticParams,
  registry: TacticRegistry = defaultRegistry,
): ApplyResult {
  const current = history[history.length - 1];
  if (!current) return { ok: false, message: "Load a problem first." };
  const tactic = registry.getById(tacticId);
  if (!tactic) return { ok: false, message: `Unknown tactic “${tacticId}”.` };

  // 1. Clone the current AST.
  const root = current.exprNode.cloneDeep();
  // 2. Locate the target sub-node.
  const target = getAt(root, path);
  if (!target) return { ok: false, message: "The selected sub-expression no longer exists." };
  const context = { root, path };

  // 3. Check the pattern.
  if (!safeCanApply(tactic, target, context)) {
    const message =
      tactic.explainMismatch?.(target, context) ??
      `**${tactic.name}** cannot be applied to $${toLatex(target)}$. ${tactic.description}`;
    return { ok: false, message };
  }

  if (tactic.paramSchema) {
    const err = tactic.validateParams?.(target, params ?? {});
    if (err) return { ok: false, message: err };
  }

  // 4. Execute the rewrite.
  let replacement: MathNode;
  try {
    replacement = tactic.apply(target, params);
  } catch (e) {
    if (e instanceof TacticError) return { ok: false, message: e.message };
    throw e;
  }

  // 5. Splice it into the cloned tree.
  const exprNode = replaceAt(root, path, replacement);

  // 6. Append the new state.
  const state: State = {
    exprNode,
    latex: toLatex(exprNode),
    appliedTacticName: tactic.name,
    targetPath: path,
    sideConditions: tactic.sideConditions?.(target, params) ?? [],
  };
  return { ok: true, history: [...history, state], state };
}
