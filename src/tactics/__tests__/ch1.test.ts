import { describe, expect, it } from "vitest";
import { structKey } from "../../engine/ast";
import { loadTactics } from "../../engine/loader";
import { parseProblem } from "../../engine/parse";
import { applyTactic, initialState } from "../../engine/transformer";
import type { NodePath, State, TacticParams } from "../../types/tactic";

const registry = loadTactics();
const P = parseProblem;
const key = (s: string) => structKey(P(s));

function rewrite(id: string, input: string, params?: TacticParams): string {
  const t = registry.getById(id);
  if (!t) throw new Error(`missing tactic ${id}`);
  const node = P(input);
  expect(t.canApply(node), `${id} should apply to ${input}`).toBe(true);
  return structKey(t.apply(node, params));
}

const applies = (id: string, input: string) => registry.getById(id)!.canApply(P(input));

// [tactic id, input, expected output, params?]
const POSITIVE: [string, string, string, TacticParams?][] = [
  ["add_comm", "a + b", "b + a"],
  ["add_assoc", "(a + b) + c", "a + (b + c)"],
  ["add_assoc_rev", "a + (b + c)", "(a + b) + c"],
  ["add_zero", "a + 0", "a"],
  ["add_zero_rev", "q", "q + 0"],
  ["mult_comm", "a * b", "b * a"],
  ["mult_assoc", "(a * b) * c", "a * (b * c)"],
  ["mult_assoc_rev", "a * (b * c)", "(a * b) * c"],
  ["mult_one", "1 * a", "a"],
  ["mult_zero", "0 * x", "0"],
  ["distribute_left", "a * (b + c + d)", "a*b + a*c + a*d"],
  ["distribute_right", "(60 + 2) * 5", "60*5 + 2*5"],
  ["factor_left", "51*9 + 51*31", "51 * (9 + 31)"],
  ["factor_right", "b*a + c*a + d*a", "(b + c + d) * a"],
  ["dist_sub_left", "a * (b - c)", "a*b - a*c"],
  ["dist_sub_right_rev", "b*a - c*a", "(b - c) * a"],
  ["neg_add_inverse", "-x + x", "0"],
  ["neg_neg", "-(-x)", "x"],
  ["neg_mult_neg_one", "(-1) * x", "-x"],
  ["neg_mult_left", "(-x) * y", "-(x*y)"],
  ["neg_mult_right", "x * (-y)", "-(x*y)"],
  ["neg_times_neg", "(-7) * (-8)", "7 * 8"],
  ["neg_of_sum", "-(x + y)", "(-x) + (-y)"],
  ["sub_def", "a - b", "a + (-b)"],
  ["sub_def_rev", "a + (-b)", "a - b"],
  ["sub_from_zero", "0 - x", "-x"],
  ["sub_self", "x - x", "0"],
  ["sub_zero", "x - 0", "x"],
  ["sub_of_neg", "x - (-y)", "x + y"],
  ["sub_from_neg", "-x - y", "-(x + y)"],
  ["neg_of_sub", "-(x - y)", "-x + y", { choice: "0" }],
  ["neg_of_sub", "-(x - y)", "y - x", { choice: "1" }],
  ["sub_eq_relation", "x + 3 = 7", "x = 7 - 3", { choice: "0" }],
  ["sub_eq_relation", "x + 3 = 7", "3 = 7 - x", { choice: "1" }],
  ["recip_inverse", "recip(2) * 2", "1"],
  ["recip_recip", "recip(recip(x))", "x"],
  ["recip_product", "recip(x) * recip(y)", "recip(x*y)"],
  ["recip_neg", "recip(-x)", "-recip(x)"],
  ["div_def", "4 / 2", "4 * recip(2)"],
  ["div_def_rev", "4 * recip(2)", "4 / 2"],
  ["div_into_zero", "0 / x", "0"],
  ["div_self", "x / x", "1"],
  ["div_by_one", "x / 1", "x"],
  ["div_into_one", "1 / x", "recip(x)"],
  ["div_by_recip", "x / recip(y)", "x * y"],
  ["div_into_neg", "(-x) / y", "-(x / y)"],
  ["div_by_neg", "x / (-y)", "-(x / y)"],
  ["div_neg_neg", "(-x) / (-y)", "x / y"],
  ["div_cancel", "(2*b) / (2*c)", "b / c"],
  ["div_dist_add", "(a + b) / c", "a/c + b/c"],
  ["div_dist_sub", "(a - b) / c", "a/c - b/c"],
  ["div_eq_relation", "3 * x = 12", "x = 12 / 3", { choice: "1" }],
  ["base10_decompose", "62", "60 + 2"],
  ["base10_decompose", "347", "300 + 47"],
  ["int_factor", "28", "4 * 7", { p: "4", q: "7" }],
  ["alu_arithmetic", "60 * 5", "300"],
  ["alu_arithmetic", "3 - 10", "-7"],
  ["alu_arithmetic", "(-7) + 3", "-4"],
  ["alu_arithmetic", "12 / 4", "3"],
  ["eq_symmetric", "7 = x", "x = 7"],
];

// [tactic id, input] pairs that must NOT apply (mostly strictness of the book's literal forms).
const NEGATIVE: [string, string][] = [
  ["mult_one", "a * 1"],
  ["add_zero", "0 + a"],
  ["mult_zero", "x * 0"],
  ["neg_add_inverse", "x + (-x)"],
  ["recip_inverse", "x * recip(x)"],
  ["recip_inverse", "recip(0) * 0"],
  ["div_def", "4 / 0"],
  ["div_self", "0 / 0"],
  ["div_dist_add", "a / (b + c)"],
  ["distribute_left", "(a + b) * c"],
  ["factor_left", "a*b + c*a"],
  ["base10_decompose", "60"],
  ["base10_decompose", "7"],
  ["alu_arithmetic", "7 / 2"],
  ["alu_arithmetic", "x + 2"],
  ["alu_arithmetic", "(1 + 2) + 3"],
  ["sub_eq_relation", "7 = x + 3"],
];

describe("chapter 1 rules", () => {
  it.each(POSITIVE)("%s: %s → %s", (id, input, expected, params) => {
    expect(rewrite(id, input, params)).toBe(key(expected));
  });
  it.each(NEGATIVE)("%s does not apply to %s", (id, input) => {
    expect(applies(id, input)).toBe(false);
  });
});

describe("everywhere macros", () => {
  it("turns every subtraction into adding a negation, respecting order of operations", () => {
    expect(rewrite("sub_def_all", "268 + 1375 + 6179 - 168 - 1275 - 6079")).toBe(
      key("268 + 1375 + 6179 + (-168) + (-1275) + (-6079)"),
    );
    expect(rewrite("sub_def_all", "a - (b - c) * d")).toBe(key("a + (-((b + (-c)) * d))"));
  });
  it("converts back", () => {
    expect(rewrite("sub_def_rev_all", "a + (-b) + (-c)")).toBe(key("a - b - c"));
  });
  it("is not legal when there is nothing to rewrite", () => {
    expect(applies("sub_def_all", "a + b")).toBe(false);
  });
  it("skips division by a literal zero and reports symbolic side conditions", () => {
    expect(rewrite("div_def_all", "a / 0 + b / c")).toBe(key("a / 0 + b * recip(c)"));
    expect(registry.getById("div_def_all")!.sideConditions!(P("b / c + d / c"))).toEqual(["c \\neq 0"]);
  });
});

describe("rearranging macros", () => {
  const t = () => registry.getById("rearrange_sum")!;
  const node = P("a - b + c");
  it("accepts any reordering/regrouping with the same signed terms", () => {
    expect(t().validateParams!(node, { expr: "(a + c) - b" })).toBeNull();
    expect(t().validateParams!(node, { expr: "-b + a + c" })).toBeNull();
    expect(t().validateParams!(node, { expr: "c + (a + (-b))" })).toBeNull();
  });
  it("rejects changed signs, dropped or extra terms", () => {
    expect(t().validateParams!(node, { expr: "a + b + c" })).toMatch(/missing/);
    expect(t().validateParams!(node, { expr: "a - b" })).toMatch(/missing/);
    expect(t().validateParams!(node, { expr: "a - b + c + 0" })).toMatch(/not in the original/);
    expect(t().validateParams!(node, { expr: "a - b + c" })).toMatch(/same expression/);
  });
  it("rearranges factors", () => {
    const f = registry.getById("rearrange_product")!;
    expect(f.validateParams!(P("25 * 7 * 4"), { expr: "(25 * 4) * 7" })).toBeNull();
    expect(f.validateParams!(P("25 * 7 * 4"), { expr: "25 * 28" })).toMatch(/missing/);
    expect(f.canApply(P("a / b"))).toBe(false);
  });
  it("prefills a round-trippable expression", () => {
    const e = P("a + (b + c) * (-d)");
    expect(structKey(P(t().paramDefaults!(e).expr))).toBe(structKey(e));
  });
});

describe("rule text", () => {
  it("contains no control characters (a sign of an escaping slip like \\t in a template string)", () => {
    for (const t of registry.getAll()) {
      expect(/[\u0000-\u001f]/.test(t.ruleLatex ?? ""), t.id).toBe(false);
    }
  });
});

describe("diagnostics", () => {
  it("explains division does not distribute into a sum", () => {
    expect(registry.getById("div_dist_add")!.explainMismatch!(P("a / (b + c)"))).toMatch(/does not distribute/);
  });
  it("suggests commutativity when the operands are swapped", () => {
    expect(registry.getById("mult_one")!.explainMismatch!(P("a * 1"))).toMatch(/Commutative/);
  });
  it("validates integer factors", () => {
    const t = registry.getById("int_factor")!;
    expect(t.validateParams!(P("28"), { p: "3", q: "9" })).toMatch(/not/);
    expect(t.validateParams!(P("28"), { p: "4", q: "7" })).toBeNull();
  });
  it("transformer returns diagnostics instead of throwing", () => {
    const r = applyTactic([initialState(P("4 / 0"))], [], "div_def");
    expect(r.ok).toBe(false);
  });
});

type Move = [NodePath, string, TacticParams?];

function play(input: string, moves: Move[]): State[] {
  let history = [initialState(P(input))];
  for (const [path, id, params] of moves) {
    const r = applyTactic(history, path, id, params, registry);
    if (!r.ok) throw new Error(`${id} at [${path}] failed: ${r.message}`);
    history = r.history;
  }
  return history;
}

const last = (h: State[]) => structKey(h[h.length - 1].exprNode);

describe("preset solutions", () => {
  it("62 · 5 = 310", () => {
    const h = play("62 * 5", [
      [[0], "base10_decompose"],
      [[], "distribute_right"],
      [[0], "alu_arithmetic"],
      [[1], "alu_arithmetic"],
      [[], "alu_arithmetic"],
    ]);
    expect(last(h)).toBe(key("310"));
    expect(h.map((s) => s.appliedTacticName)[2]).toBe("Distributive Property (sum on the left)");
  });

  it("4 ÷ 2 = 2", () => {
    const h = play("4 / 2", [
      [[], "div_def"],
      [[0], "int_factor", { p: "2", q: "2" }],
      [[], "mult_assoc"],
      [[1], "mult_comm"],
      [[1], "recip_inverse"],
      [[], "mult_comm"],
      [[], "mult_one"],
    ]);
    expect(last(h)).toBe(key("2"));
    expect(h).toHaveLength(8);
  });

  it("25 · 28 = 700", () => {
    const h = play("25 * 28", [
      [[1], "int_factor", { p: "4", q: "7" }],
      [[], "mult_assoc_rev"],
      [[0], "alu_arithmetic"],
      [[], "alu_arithmetic"],
    ]);
    expect(last(h)).toBe(key("700"));
  });

  it("268 + 1375 + 6179 − 168 − 1275 − 6079 = 300 via Rearrange Terms", () => {
    const h = play("268 + 1375 + 6179 - 168 - 1275 - 6079", [
      [[], "rearrange_sum", { expr: "(268 - 168) + (1375 - 1275) + (6179 - 6079)" }],
      [[0, 0], "alu_arithmetic"],
      [[0, 1], "alu_arithmetic"],
      [[1], "alu_arithmetic"],
      [[0], "alu_arithmetic"],
      [[], "alu_arithmetic"],
    ]);
    expect(last(h)).toBe(key("300"));
  });

  it("x + 3 = 7 gives x = 4", () => {
    const h = play("x + 3 = 7", [
      [[], "sub_eq_relation", { choice: "0" }],
      [[1], "alu_arithmetic"],
    ]);
    expect(last(h)).toBe(key("x = 4"));
  });

  it("history states are immutable", () => {
    const h = play("62 * 5", [[[0], "base10_decompose"]]);
    expect(structKey(h[0].exprNode)).toBe(key("62 * 5"));
  });
});
