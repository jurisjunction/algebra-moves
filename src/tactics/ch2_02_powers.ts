import type { MathNode } from "mathjs";
import type { TacticPlugin } from "../types/tactic";
import { isConst, isOp, literalValue, mul, neg, num, op, structKey } from "../engine/ast";
import { defineRules } from "../engine/defineRule";
import { TacticError } from "../engine/errors";
import { toLatex } from "../engine/latex";
import { CH2 } from "./_chapters";

const section = "Higher Exponents";

/** Longest product `pow_def` will write out; longer ones are unreadable, and the laws do better. */
const MAX_COPIES = 12;
/** Largest value the Power Table will produce. */
const TABLE_LIMIT = 1_000_000;

const NOT_SUM_OF_POWERS =
  "A power of a sum is **not** the sum of the powers: $(1 + 1)^3 = 8$, but $1^3 + 1^3 = 2$. Powers pass through products and quotients, never through sums or differences.";

const posInt = (n: MathNode): number | null =>
  isConst(n) && Number.isInteger(n.value) && n.value >= 1 ? n.value : null;

const power = (base: MathNode, exp: number) => op("pow", [base, num(exp)]);

/** `a^n` with a whole-number exponent n ≥ 1, as [base, n]. */
function literalPower(node: MathNode): [MathNode, number] | null {
  if (!isOp(node, "pow")) return null;
  const n = posInt(node.args[1]);
  return n === null ? null : [node.args[0], n];
}

const powDef: TacticPlugin = {
  id: "pow_def",
  name: "Definition of Power",
  chapter: CH2,
  section,
  category: "axiom",
  direction: "forward",
  description: "For a positive integer n, aⁿ is the product of n copies of a: a⁵ = a·a·a·a·a.",
  ruleLatex: "a^n = \\underbrace{a \\cdot a \\cdots a}_{n\\ \\text{copies}}",
  canApply: (node) => {
    const p = literalPower(node);
    return p !== null && p[1] >= 2 && p[1] <= MAX_COPIES;
  },
  explainMismatch: (node) => {
    const p = literalPower(node);
    if (!p) {
      return isOp(node, "pow")
        ? `The exponent must be a whole number of at least 1 before a power can be written out. Compute the exponent first.`
        : `**Definition of Power** works on a power like $a^5$. $${toLatex(node)}$ is not one.`;
    }
    if (p[1] === 1) return "An exponent of 1 means one copy: use **Exponent of 1**, $a^1 = a$.";
    return `$${p[1]}$ copies is too many to write out. Use the exponent laws instead.`;
  },
  apply: (node) => {
    const p = literalPower(node);
    if (!p || p[1] < 2 || p[1] > MAX_COPIES) throw new TacticError("Not a power that can be written out.");
    let out = p[0].cloneDeep();
    for (let i = 1; i < p[1]; i++) out = mul(out, p[0].cloneDeep());
    return out;
  },
};

/**
 * Split a product into copies of one base, however it is grouped: `(a·a)·(a·a)` is 4 copies of a,
 * and `(ab)(ab)` is 2 copies of ab.
 */
function copies(n: MathNode): { base: MathNode; count: number } {
  if (isOp(n, "multiply") && n.args.length === 2) {
    const l = copies(n.args[0]);
    const r = copies(n.args[1]);
    if (structKey(l.base) === structKey(r.base)) return { base: l.base, count: l.count + r.count };
  }
  return { base: n, count: 1 };
}

const powCollect: TacticPlugin = {
  id: "pow_def_rev",
  name: "Definition of Power (collect)",
  chapter: CH2,
  section,
  category: "axiom",
  direction: "reverse",
  description: "A product of n copies of a is aⁿ: a·a·a = a³.",
  ruleLatex: "\\underbrace{a \\cdot a \\cdots a}_{n\\ \\text{copies}} = a^n",
  canApply: (node) => isOp(node, "multiply") && copies(node).count >= 2,
  explainMismatch: (node) =>
    isOp(node, "multiply")
      ? `Every factor must be the same to collect them into a power. $${toLatex(node)}$ mixes different factors: rearrange it, or select a smaller piece.`
      : `**Collect** works on a product of equal factors, like $a \\cdot a \\cdot a$. $${toLatex(node)}$ is not a product.`,
  apply: (node) => {
    const c = copies(node);
    if (!isOp(node, "multiply") || c.count < 2) throw new TacticError("Not a product of equal factors.");
    return power(c.base.cloneDeep(), c.count);
  },
};

const powNeg: TacticPlugin = {
  id: "pow_neg",
  name: "Power of Negation",
  chapter: CH2,
  section,
  category: "axiom",
  direction: "forward",
  description: "(−a)ⁿ = aⁿ when n is even, and −aⁿ when n is odd.",
  ruleLatex: "(-a)^n = \\begin{cases} a^n & n \\text{ even} \\\\ -a^n & n \\text{ odd} \\end{cases}",
  canApply: (node) => {
    const p = literalPower(node);
    return p !== null && isOp(p[0], "unaryMinus");
  },
  explainMismatch: (node) => {
    if (isOp(node, "unaryMinus") && isOp(node.args[0], "pow")) {
      return "This is the **negation of a power**, $-(a^n)$, not a power of a negation. Powers come before negation, so $-1^{2008}$ means $-(1^{2008})$.";
    }
    if (isOp(node, "pow") && isOp(node.args[0], "unaryMinus")) {
      return "The exponent must be a whole number before we can tell whether it is even or odd. Compute it first.";
    }
    return `**Power of Negation** works on a power of a negation, like $(-a)^5$. $${toLatex(node)}$ is not one.`;
  },
  apply: (node) => {
    const p = literalPower(node);
    if (!p || !isOp(p[0], "unaryMinus")) throw new TacticError("Not a power of a negation.");
    const inner = power(p[0].args[0].cloneDeep(), p[1]);
    return p[1] % 2 === 0 ? inner : neg(inner);
  },
};

function tableValue(node: MathNode): number | null {
  const p = literalPower(node);
  if (!p || !isConst(p[0])) return null;
  const b = p[0].value;
  if (!Number.isInteger(b) || b < 0) return null;
  if (b <= 1) return b;
  let v = 1;
  for (let i = 0; i < p[1]; i++) {
    v *= b;
    if (v > TABLE_LIMIT) return null;
  }
  return v;
}

/** The smallest base b ≥ 2 with bᵏ = n for some k ≥ 2, e.g. 64 → 2⁶, 121 → 11². */
function asPower(n: number): [number, number] | null {
  if (!Number.isInteger(n) || n < 4 || n > TABLE_LIMIT) return null;
  for (let b = 2; b * b <= n; b++) {
    let v = b;
    let k = 1;
    while (v < n) {
      v *= b;
      k++;
    }
    if (v === n) return [b, k];
  }
  return null;
}

const powTable: TacticPlugin = {
  id: "pow_table",
  name: "Power Table",
  chapter: CH2,
  section,
  category: "alu",
  direction: "forward",
  description: `Evaluate a whole-number power up to ${TABLE_LIMIT.toLocaleString("en-US")}: 2⁸ = 256, 1²⁰⁰⁸ = 1.`,
  ruleLatex: "2^8 = 256",
  canApply: (node) => tableValue(node) !== null,
  explainMismatch: (node) => {
    const p = literalPower(node);
    if (!p || !isConst(p[0])) {
      return `The Power Table evaluates a whole number raised to a whole-number exponent, like $2^8$. $${toLatex(node)}$ is not one.`;
    }
    return `$${toLatex(node)}$ is larger than ${TABLE_LIMIT.toLocaleString("en-US")}. Find a smarter route with the exponent laws.`;
  },
  apply: (node) => {
    const v = tableValue(node);
    if (v === null) throw new TacticError("Not in the table.");
    return num(v);
  },
};

const powTableRev: TacticPlugin = {
  id: "pow_table_rev",
  name: "Power Table (write as a power)",
  chapter: CH2,
  section,
  category: "alu",
  direction: "reverse",
  description: "Write a perfect power as a power of its smallest base: 8 = 2³, 64 = 2⁶, 121 = 11².",
  ruleLatex: "8 = 2^3",
  canApply: (node) => isConst(node) && asPower(node.value) !== null,
  explainMismatch: (node) => {
    const v = literalValue(node);
    return v === null
      ? `Select a single whole number, like $8$. $${toLatex(node)}$ is not one.`
      : `$${v}$ is not a perfect power of a smaller whole number.`;
  },
  apply: (node) => {
    const p = isConst(node) ? asPower(node.value) : null;
    if (!p) throw new TacticError("Not a perfect power.");
    return power(num(p[0]), p[1]);
  },
};

const lawRules = defineRules([
  {
    id: "pow_one",
    name: "Exponent of 1",
    chapter: CH2,
    section,
    description: "a¹ = a. One copy of a is just a.",
    lhs: "a^1",
    rhs: "a",
    bidirectional: true,
    reverseName: "Exponent of 1 (introduce ¹)",
  },
  {
    id: "pow_product",
    name: "Power of Product",
    chapter: CH2,
    section,
    description: "(ab)ⁿ = aⁿbⁿ.",
    lhs: "(a * b)^n",
    rhs: "a^n * b^n",
    bidirectional: true,
    pitfalls: [
      { when: "(a + b)^n", message: NOT_SUM_OF_POWERS },
      { when: "(a - b)^n", message: NOT_SUM_OF_POWERS },
    ],
  },
  {
    id: "pow_recip",
    name: "Power of Reciprocal",
    chapter: CH2,
    section,
    description: "For nonzero b: (1/b)ⁿ = 1/bⁿ.",
    lhs: "recip(b)^n",
    rhs: "recip(b^n)",
    nonzero: ["b"],
    bidirectional: true,
  },
  {
    id: "pow_quotient",
    name: "Power of Quotient",
    chapter: CH2,
    section,
    description: "For nonzero b: (a ÷ b)ⁿ = aⁿ ÷ bⁿ.",
    lhs: "(a / b)^n",
    rhs: "a^n / b^n",
    nonzero: ["b"],
    bidirectional: true,
    pitfalls: [
      { when: "(a + b)^n", message: NOT_SUM_OF_POWERS },
      { when: "(a - b)^n", message: NOT_SUM_OF_POWERS },
    ],
  },
  {
    id: "pow_add",
    name: "Product of Powers (same base)",
    chapter: CH2,
    section,
    description: "aᵐ · aⁿ = aᵐ⁺ⁿ. Count the copies of a.",
    lhs: "a^m * a^n",
    rhs: "a^(m + n)",
    bidirectional: true,
    pitfalls: [
      {
        when: "a^n * b^n",
        message: "The bases differ, so the copies cannot be counted together. With the **same exponent**, use **Power of Product** backwards: $a^n b^n = (ab)^n$.",
      },
    ],
  },
  {
    id: "pow_pow",
    name: "Power of Power",
    chapter: CH2,
    section,
    description: "(aᵐ)ⁿ = aᵐⁿ.",
    lhs: "(a^m)^n",
    rhs: "a^(m * n)",
    bidirectional: true,
  },
]);

// The book states the quotient rule only for m > n; zero and negative exponents come in 2.3–2.4.
const [powSubBase] = defineRules([
  {
    id: "pow_sub",
    name: "Quotient of Powers (same base)",
    chapter: CH2,
    section,
    description: "For nonzero a and m > n: aᵐ ÷ aⁿ = aᵐ⁻ⁿ.",
    lhs: "a^m / a^n",
    rhs: "a^(m - n)",
    nonzero: ["a"],
  },
]);

const exponentsTooSmall = (node: MathNode): boolean => {
  if (!isOp(node, "divide") || !isOp(node.args[0], "pow") || !isOp(node.args[1], "pow")) return false;
  const m = literalValue(node.args[0].args[1]);
  const n = literalValue(node.args[1].args[1]);
  return m !== null && n !== null && m <= n;
};

const powSub: TacticPlugin = {
  ...powSubBase,
  canApply: (node, ctx) => powSubBase.canApply(node, ctx) && !exponentsTooSmall(node),
  explainMismatch: (node, ctx) =>
    powSubBase.canApply(node, ctx) && exponentsTooSmall(node)
      ? "For now this law needs the top exponent to be larger than the bottom one. What happens otherwise is the subject of sections 2.3 and 2.4."
      : powSubBase.explainMismatch!(node, ctx),
  apply: (node, params) => {
    if (exponentsTooSmall(node)) throw new TacticError("The top exponent must be larger.");
    return powSubBase.apply(node, params);
  },
};

export default [powDef, powCollect, powNeg, ...lawRules, powSub, powTable, powTableRev] satisfies TacticPlugin[];
