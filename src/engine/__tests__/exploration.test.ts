import { describe, expect, it } from "vitest";
import { back, depthOf, explore, extend, hasBranches, lineTo, loopOf, moveTo, transpositionsOf } from "../exploration";
import { parseProblem } from "../parse";
import { initialState } from "../transformer";
import type { State } from "../../types/tactic";

const st = (expr: string, move = "Commute"): State => ({ ...initialState(parseProblem(expr)), appliedTacticName: move });
const exprs = (states: State[]) => states.map((s) => s.latex);

describe("exploration tree", () => {
  it("extends, goes back, and keeps the abandoned line", () => {
    let ex = explore(initialState(parseProblem("(a + b) + c")));
    ex = extend(ex, st("c + (a + b)"));
    ex = extend(ex, st("c + (b + a)"));
    expect(depthOf(ex, ex.current)).toBe(2);
    const deep = ex.current;

    ex = back(back(ex));
    expect(ex.current).toBe(0);
    expect(back(ex)).toBe(ex);

    ex = extend(ex, st("(b + a) + c"));
    expect(ex.nodes).toHaveLength(4);
    expect(hasBranches(ex)).toBe(true);
    expect(exprs(lineTo(ex))).toEqual(exprs([initialState(parseProblem("(a + b) + c")), st("(b + a) + c")]));

    ex = moveTo(ex, deep);
    expect(lineTo(ex)).toHaveLength(3);
  });

  it("revisits a branch instead of duplicating it", () => {
    let ex = explore(initialState(parseProblem("a + b")));
    ex = extend(ex, st("b + a"));
    ex = back(ex);
    ex = extend(ex, st("b + a"));
    expect(ex.nodes).toHaveLength(2);
    expect(ex.current).toBe(1);
    expect(hasBranches(ex)).toBe(false);
  });

  it("reports a loop back to an earlier step", () => {
    let ex = explore(initialState(parseProblem("a + b")));
    ex = extend(ex, st("b + a"));
    expect(loopOf(ex)).toBeNull();
    ex = extend(ex, st("a + b"));
    expect(loopOf(ex)).toBe(0);
  });

  it("reports transpositions across lines, but not along one", () => {
    let ex = explore(initialState(parseProblem("(a + b) + c")));
    ex = extend(ex, st("c + (a + b)"));
    ex = extend(ex, st("c + (b + a)"));
    const first = ex.current;
    ex = moveTo(ex, 0);
    ex = extend(ex, st("(b + a) + c"));
    ex = extend(ex, st("c + (b + a)"));
    expect(transpositionsOf(ex, ex.current)).toEqual([first]);
    expect(transpositionsOf(ex, first)).toEqual([ex.current]);

    ex = extend(ex, st("(b + a) + c"));
    expect(loopOf(ex)).not.toBeNull();
    expect(transpositionsOf(ex, ex.current)).toEqual([]);
  });
});
