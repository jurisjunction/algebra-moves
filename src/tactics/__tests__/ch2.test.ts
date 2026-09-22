import { describe, expect, it } from "vitest";
import { structKey } from "../../engine/ast";
import { toLatex } from "../../engine/latex";
import { loadTactics } from "../../engine/loader";
import { parseProblem } from "../../engine/parse";
import type { TacticParams } from "../../types/tactic";

const registry = loadTactics();
const P = parseProblem;
const key = (s: string) => structKey(P(s));

function rewrite(id: string, input: string, params?: TacticParams): string {
  const t = registry.getById(id)!;
  expect(t.canApply(P(input)), `${id} should apply to ${input}`).toBe(true);
  return structKey(t.apply(P(input), params));
}

const applies = (id: string, input: string) => registry.getById(id)!.canApply(P(input));
const why = (id: string, input: string) => registry.getById(id)!.explainMismatch!(P(input));

const POSITIVE: [string, string, string, TacticParams?][] = [
  ["square_def", "3^2", "3 * 3"],
  ["square_def_rev", "(a + 1) * (a + 1)", "(a + 1)^2"],
  ["square_neg", "(-12)^2", "12^2"],
  ["square_product", "(8 * 125)^2", "8^2 * 125^2"],
  ["square_product_rev", "8^2 * 125^2", "(8 * 125)^2"],
  ["square_recip", "recip(7)^2", "recip(7^2)"],
  ["square_recip_rev", "recip(x^2)", "recip(x)^2"],
  ["square_quotient", "(7224 / 12)^2", "7224^2 / 12^2"],
  ["square_quotient_rev", "480^2 / 40^2", "(480 / 40)^2"],
  ["square_next", "(900 + 1)^2", "900^2 + 2 * 900 + 1", { choice: "0" }],
  ["square_next", "(a + 1)^2", "a^2 + a + (a + 1)", { choice: "1" }],
  ["square_table", "29^2", "841"],
  ["square_table", "0^2", "0"],
];

const NEGATIVE: [string, string][] = [
  ["square_def", "3^3"],
  ["square_def_rev", "a * b"],
  ["square_neg", "-(2^2)"],
  ["square_product", "(a + b)^2"],
  ["square_recip", "recip(0)^2"],
  ["square_quotient", "(a / 0)^2"],
  ["square_next", "(a + 2)^2"],
  ["square_next", "(1 + a)^2"],
  ["square_table", "30^2"],
  ["square_table", "(-3)^2"],
  ["square_table", "x^2"],
];

describe("chapter 2 rules", () => {
  it.each(POSITIVE)("%s: %s → %s", (id, input, expected, params) => {
    expect(rewrite(id, input, params)).toBe(key(expected));
  });
  it.each(NEGATIVE)("%s does not apply to %s", (id, input) => {
    expect(applies(id, input)).toBe(false);
  });
});

describe("chapter 2 diagnostics", () => {
  it("the square of a sum is not the sum of squares", () => {
    expect(why("square_product", "(5 + 6)^2")).toMatch(/not\*\* the sum of the squares/);
  });
  it("−2² is the negation of a square", () => {
    expect(why("square_neg", "-2^2")).toMatch(/negation of a square/);
  });
  it("the table points past its range", () => {
    expect(why("square_table", "901^2")).toMatch(/only holds/);
  });
});

describe("parsing and rendering powers", () => {
  it("powers bind tighter than negation, as in the book", () => {
    expect(key("-2^2")).toBe(key("-(2^2)"));
    expect(key("-2^2")).not.toBe(key("(-2)^2"));
  });
  it("brackets a negated base and juxtaposes a coefficient with a variable power", () => {
    expect(toLatex(P("(-2)^2"))).toContain("\\left(-2\\right)");
    expect(toLatex(P("2 * x^2"))).not.toContain("\\cdot");
    expect(toLatex(P("2 * 3^2"))).toContain("\\cdot");
  });
});

const POWER_POSITIVE: [string, string, string, TacticParams?][] = [
  ["pow_def", "a^5", "a * a * a * a * a"],
  ["pow_def", "(-4)^3", "(-4) * (-4) * (-4)"],
  ["pow_def_rev", "a * a * a", "a^3"],
  ["pow_def_rev", "(a * a) * (a * a * a)", "a^5"],
  ["pow_def_rev", "(a * b) * (a * b)", "(a * b)^2"],
  ["pow_one", "17^1", "17"],
  ["pow_neg", "(-a)^4", "a^4"],
  ["pow_neg", "(-a)^5", "-(a^5)"],
  ["pow_product", "(a * b)^n", "a^n * b^n"],
  ["pow_product_rev", "25^3 * 4^3", "(25 * 4)^3"],
  ["pow_recip", "recip(2)^5", "recip(2^5)"],
  ["pow_quotient_rev", "88888^4 / 22222^4", "(88888 / 22222)^4"],
  ["pow_add", "a^3 * a^5", "a^(3 + 5)"],
  ["pow_add_rev", "9^(4 + 3)", "9^4 * 9^3"],
  ["pow_sub", "9^7 / 9^3", "9^(7 - 3)"],
  ["pow_pow", "(7^5)^3", "7^(5 * 3)"],
  ["pow_pow_rev", "11^(2 * 10000)", "(11^2)^10000"],
  ["pow_table", "2^8", "256"],
  ["pow_table", "1^2008", "1"],
  ["pow_table", "100^3", "1000000"],
  ["pow_table_rev", "64", "2^6"],
  ["pow_table_rev", "121", "11^2"],
];

const POWER_NEGATIVE: [string, string][] = [
  ["pow_def", "a^1"],
  ["pow_def", "7^20"],
  ["pow_def", "a^n"],
  ["pow_def_rev", "a * b"],
  ["pow_neg", "-(a^4)"],
  ["pow_neg", "(-a)^n"],
  ["pow_product", "(a + b)^3"],
  ["pow_add", "a^3 * b^5"],
  ["pow_sub", "9^3 / 9^7"],
  ["pow_sub", "0^7 / 0^3"],
  ["pow_pow", "a^(m * n)"],
  ["pow_table", "2^20"],
  ["pow_table", "(-2)^3"],
  ["pow_table_rev", "12"],
];

describe("chapter 2 higher exponents", () => {
  it.each(POWER_POSITIVE)("%s: %s → %s", (id, input, expected, params) => {
    expect(rewrite(id, input, params)).toBe(key(expected));
  });
  it.each(POWER_NEGATIVE)("%s does not apply to %s", (id, input) => {
    expect(applies(id, input)).toBe(false);
  });
  it("explains the diagnostics the book warns about", () => {
    expect(why("pow_product", "(1 + 1)^3")).toMatch(/not\*\* the sum of the powers/);
    expect(why("pow_neg", "-1^2008")).toMatch(/negation of a power/);
    expect(why("pow_sub", "9^3 / 9^7")).toMatch(/2\.3 and 2\.4/);
    expect(why("pow_add", "a^3 * b^3")).toMatch(/Power of Product/);
  });
  it("reads a tower of exponents from the top down", () => {
    expect(key("2^2^3")).toBe(key("2^(2^3)"));
  });
});
