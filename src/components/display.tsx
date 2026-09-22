import type { MathNode } from "mathjs";
import { createContext, useCallback, useContext } from "react";
import { toLatex, type LatexOptions } from "../engine/latex";

export interface DisplayPrefs {
  /**
   * Bracket every grouping, e.g. `(a + b) + c`, instead of relying on the left-to-right
   * convention (`a + b + c`). This is exactly what the rules act on.
   */
  explicitGrouping: boolean;
}

export const DisplayContext = createContext<DisplayPrefs>({ explicitGrouping: true });

/** `toLatex` bound to the viewer's display preferences. */
export function useTex() {
  const { explicitGrouping } = useContext(DisplayContext);
  return useCallback(
    (node: MathNode, opts: LatexOptions = {}) => toLatex(node, { explicitGrouping, ...opts }),
    [explicitGrouping],
  );
}

const KEY = "algebra-moves:display:v1";

export function loadDisplayPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { explicitGrouping: true, ...JSON.parse(raw) };
  } catch {
    // storage unavailable: use defaults
  }
  return { explicitGrouping: true };
}

export function saveDisplayPrefs(p: DisplayPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage unavailable: preference lasts for this session only
  }
}
