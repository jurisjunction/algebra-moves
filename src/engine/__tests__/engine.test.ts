import { describe, expect, it } from "vitest";
import { getAt, replaceAt, structKey } from "../ast";
import { parseProblem, ParseError } from "../parse";
import { compilePattern, match } from "../pattern";
import { toLatex } from "../latex";
import { TacticRegistry } from "../registry";
import { defineRule } from "../defineRule";

const P = parseProblem;

describe("parse", () => {
  it("strips parentheses and keeps grouping in the tree", () => {
    expect(structKey(P("(a*b)*c"))).toBe("multiply(multiply($a,$b),$c)");
    expect(structKey(P("a*(b*c)"))).toBe("multiply($a,multiply($b,$c))");
  });
  it("applies order of operations left to right", () => {
    expect(structKey(P("a - b - c"))).toBe("subtract(subtract($a,$b),$c)");
    expect(structKey(P("2 + 3 * 4"))).toBe("add(#2,multiply(#3,#4))");
  });
  it("parses equations, negation, reciprocal", () => {
    expect(structKey(P("x + 3 = 7"))).toBe("equal(add($x,#3),#7)");
    expect(structKey(P("-3"))).toBe("unaryMinus(#3)");
    expect(structKey(P("recip(x)"))).toBe("@recip($x)");
  });
  it("rejects unsupported input", () => {
    expect(() => P("sin(x)")).toThrow(ParseError);
    expect(() => P("a = b = c")).toThrow(ParseError);
  });
});

describe("paths", () => {
  it("gets and replaces immutably", () => {
    const root = P("a*(b+c)");
    expect(structKey(getAt(root, [1, 0])!)).toBe("$b");
    const next = replaceAt(root, [1, 0], P("z"));
    expect(structKey(next)).toBe("multiply($a,add($z,$c))");
    expect(structKey(root)).toBe("multiply($a,add($b,$c))");
  });
});

describe("pattern matching", () => {
  it("binds variables consistently", () => {
    const pat = compilePattern("x - x");
    expect(match(pat, P("(a+1) - (a+1)"))).not.toBeNull();
    expect(match(pat, P("(a+1) - (a+2)"))).toBeNull();
  });
  it("matches literals exactly", () => {
    expect(match(compilePattern("1 * a"), P("1 * 5"))).not.toBeNull();
    expect(match(compilePattern("1 * a"), P("5 * 1"))).toBeNull();
  });
  it("distinguishes negation, subtraction, reciprocal, division", () => {
    expect(match(compilePattern("-x"), P("a - b"))).toBeNull();
    expect(match(compilePattern("recip(x)"), P("1 / x"))).toBeNull();
    expect(match(compilePattern("a / b"), P("1 / x"))).not.toBeNull();
  });
});

describe("latex", () => {
  it("shows grouping faithfully", () => {
    expect(toLatex(P("(a*b)*c"))).toBe("a b \\cdot c");
    expect(toLatex(P("(a+b)+c"))).toBe("a + b + c");
    expect(toLatex(P("a+(b+c)"))).toBe("a + \\left(b + c\\right)");
    expect(toLatex(P("(268 - 168) + (1375 - 1275)"))).toBe("268 - 168 + \\left(1375 - 1275\\right)");
    expect(toLatex(P("a*(b*c)"))).toBe("a \\left(b c\\right)");
    expect(toLatex(P("a + (-b)"))).toBe("a + \\left(-b\\right)");
    expect(toLatex(P("-(x*y)"))).toBe("-\\left(x y\\right)");
    expect(toLatex(P("4 / 2"))).toBe("4 \\div 2");
    expect(toLatex(P("recip(2)"))).toBe("\\frac{1}{2}");
    expect(toLatex(P("60 * 5"))).toBe("60 \\cdot 5");
  });
  it("tags paths and focus", () => {
    const s = toLatex(P("a+b"), { interactive: true, focus: [1] });
    expect(s).toContain("\\htmlData{path=p}");
    expect(s).toContain("\\htmlData{path=p1}{\\htmlClass{am-focus}{b}}");
  });
});

describe("defineRule", () => {
  const [fwd, rev] = defineRule({
    id: "t",
    name: "T",
    chapter: "C",
    description: "",
    lhs: "a / b",
    rhs: "a * recip(b)",
    nonzero: ["b"],
    bidirectional: true,
  });
  it("creates forward and reverse", () => {
    expect(rev.id).toBe("t_rev");
    expect(rev.direction).toBe("reverse");
    expect(structKey(fwd.apply(P("4 / 2")))).toBe("multiply(#4,@recip(#2))");
    expect(structKey(rev.apply(P("4 * recip(2)")))).toBe("divide(#4,#2)");
  });
  it("refuses a literal zero and reports symbolic side conditions", () => {
    expect(fwd.canApply(P("4 / 0"))).toBe(false);
    expect(fwd.explainMismatch!(P("4 / 0"))).toMatch(/reciprocal of 0 is undefined/);
    expect(fwd.sideConditions!(P("4 / y"))).toEqual(["y \\neq 0"]);
    expect(fwd.sideConditions!(P("4 / 2"))).toEqual([]);
  });
  it("marks introducing reverses", () => {
    const [, intro] = defineRule({ id: "z", name: "Z", chapter: "C", description: "", lhs: "a + 0", rhs: "a", bidirectional: true });
    expect(intro.direction).toBe("introduce");
    expect(structKey(intro.apply(P("q")))).toBe("add($q,#0)");
  });
  it("rejects rhs variables missing from lhs", () => {
    expect(() => defineRule({ id: "bad", name: "", chapter: "", description: "", lhs: "a", rhs: "a + b" })).toThrow();
  });
});

describe("registry", () => {
  it("rejects duplicates and groups by chapter", () => {
    const r = new TacticRegistry();
    const [t] = defineRule({ id: "x", name: "X", chapter: "C1", description: "", lhs: "a + 0", rhs: "a" });
    r.registerTactic(t);
    expect(() => r.registerTactic(t)).toThrow();
    expect(r.getChapters()).toEqual(["C1"]);
    expect(r.getAvailableTacticsForNode(P("5 + 0")).map((x) => x.id)).toEqual(["x"]);
    expect(r.getAvailableTacticsForNode(P("0 + 5"))).toEqual([]);
  });
});
