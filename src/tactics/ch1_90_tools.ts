import type { MathNode } from "mathjs";
import type { TacticPlugin } from "../types/tactic";
import { add, isConst, isOp, literalValue, mul, num, type OpFn } from "../engine/ast";
import { defineRules } from "../engine/defineRule";
import { TacticError } from "../engine/errors";
import { toLatex } from "../engine/latex";
import { CH1 } from "./_chapters";

const section = "Arithmetic Tools";

const intConst = (n: MathNode): number | null =>
  isConst(n) && Number.isSafeInteger(n.value) && n.value >= 0 ? n.value : null;

function base10Split(n: number): [number, number] | null {
  if (n < 10) return null;
  const place = 10 ** (String(n).length - 1);
  const lead = Math.floor(n / place) * place;
  return lead === n ? null : [lead, n - lead];
}

const base10Decompose: TacticPlugin = {
  id: "base10_decompose",
  name: "Base-10 Decomposition",
  chapter: CH1,
  section,
  category: "alu",
  direction: "forward",
  description: "Split a whole number into its leading place value plus the rest: 62 = 60 + 2.",
  ruleLatex: "62 = 60 + 2",
  canApply: (node) => {
    const n = intConst(node);
    return n !== null && base10Split(n) !== null;
  },
  explainMismatch: (node) => {
    const n = intConst(node);
    if (n === null) return `Base-10 decomposition works on a single whole number. $${toLatex(node)}$ is not one.`;
    if (n < 10) return `$${n}$ has only one digit, so there is nothing to split.`;
    return `$${n}$ is already a whole multiple of its leading place value.`;
  },
  apply: (node) => {
    const [lead, rest] = base10Split(intConst(node)!)!;
    return add(num(lead), num(rest));
  },
};

function parseFactors(params: Record<string, string> | undefined): [number, number] | null {
  const p = Number(params?.p);
  const q = Number(params?.q);
  if (!params?.p?.trim() || !params?.q?.trim() || !Number.isInteger(p) || !Number.isInteger(q)) return null;
  return [p, q];
}

const intFactor: TacticPlugin = {
  id: "int_factor",
  name: "Factor an Integer",
  chapter: CH1,
  section,
  category: "alu",
  direction: "forward",
  description: "Rewrite a whole number as a product of two whole numbers: 28 = 4 · 7.",
  ruleLatex: "n = p \\cdot q \\quad (p \\cdot q = n)",
  paramSchema: { type: "factors", prompt: "What two factors do you want to break {n} into?" },
  canApply: (node) => {
    const n = intConst(node);
    return n !== null && n >= 2;
  },
  explainMismatch: (node) =>
    `Factoring an integer works on a single whole number of at least 2. $${toLatex(node)}$ is not one.`,
  validateParams: (node, params) => {
    const f = parseFactors(params);
    if (!f) return "Enter two whole numbers.";
    const n = intConst(node)!;
    if (f[0] < 1 || f[1] < 1) return "Use positive whole numbers.";
    if (f[0] * f[1] !== n) return `$${f[0]} \\cdot ${f[1]} = ${f[0] * f[1]}$, not $${n}$. Try again.`;
    return null;
  },
  apply: (node, params) => {
    const f = parseFactors(params);
    if (!f || f[0] * f[1] !== intConst(node)) throw new TacticError("Those factors do not multiply to the number.");
    return mul(num(f[0]), num(f[1]));
  },
};

const ALU_FNS: OpFn[] = ["add", "subtract", "multiply", "divide"];

function aluCompute(node: MathNode): number | string {
  if (!isOp(node) || !ALU_FNS.includes(node.fn) || node.args.length !== 2) {
    return `Arithmetic evaluates one operation (+, −, ×, ÷) between two numbers. $${toLatex(node)}$ is not a single operation.`;
  }
  const a = literalValue(node.args[0]);
  const b = literalValue(node.args[1]);
  if (a === null || b === null) {
    return "Both sides of the operation must already be plain numbers. Simplify the inside first.";
  }
  if (!Number.isInteger(a) || !Number.isInteger(b)) return "Arithmetic works on whole numbers only (for now).";
  switch (node.fn) {
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "divide":
      if (b === 0) return "The reciprocal of 0 is undefined, so we can never divide by 0.";
      if (a % b !== 0) return `$${a} \\div ${b}$ is not a whole number. Fractions come in a later chapter.`;
      return a / b;
  }
  return "Unsupported operation.";
}

/** Count of nonzero digits: 300 → 1 ("round"), 62 → 2, 268 → 3. */
export const nonzeroDigits = (v: number) => String(Math.abs(v)).replace(/[^1-9]/g, "").length;
const isRound = (v: number) => nonzeroDigits(v) <= 1;

interface AluTier {
  id: string;
  name: string;
  description: string;
  ruleLatex: string;
  /** Refuse negative operands (results may still be negative). */
  naturalOnly?: boolean;
  /** Returns an explanation if this tier cannot handle the operands, else null. */
  limit?: (a: number, b: number) => string | null;
}

/** Arithmetic tactics of increasing power. The campaign unlocks them in order. */
function makeAlu(tier: AluTier): TacticPlugin {
  const compute = (node: MathNode): number | string => {
    const r = aluCompute(node);
    if (typeof r === "string" || !tier.limit || !isOp(node)) return r;
    const a = literalValue(node.args[0])!;
    const b = literalValue(node.args[1])!;
    if (tier.naturalOnly && (a < 0 || b < 0)) {
      return "This arithmetic unit only knows counting numbers. Use the negation rules to move the minus signs out of the way first.";
    }
    return tier.limit(a, b) ?? r;
  };
  return {
    id: tier.id,
    name: tier.name,
    chapter: CH1,
    section,
    category: "alu",
    direction: "forward",
    description: tier.description,
    ruleLatex: tier.ruleLatex,
    canApply: (node) => {
      const r = compute(node);
      return typeof r === "number" && Number.isSafeInteger(r);
    },
    explainMismatch: (node) => {
      const r = compute(node);
      return typeof r === "string" ? r : "The result is too large to compute exactly.";
    },
    apply: (node) => {
      const r = compute(node);
      if (typeof r === "string") throw new TacticError(r);
      return num(r);
    },
  };
}

const aluRound = makeAlu({
  id: "alu_round",
  name: "Arithmetic (round numbers)",
  description: "Compute one operation when both numbers are round (a single nonzero digit): 7 + 8, 60 · 5, 300 + 10.",
  ruleLatex: "60 \\cdot 5 = 300",
  naturalOnly: true,
  limit: (a, b) =>
    isRound(a) && isRound(b)
      ? null
      : `This arithmetic unit only handles **round** numbers, those with a single nonzero digit like $7$, $40$, $300$. Break $${[a, b].filter((v) => !isRound(v)).join("$ and $")}$ apart by place value first.`,
});

const aluOneRound = makeAlu({
  id: "alu_one_round",
  name: "Arithmetic (one round number)",
  description: "Compute one operation when one number is round and the other has at most two nonzero digits: 62 · 5, 25 · 4, 51 · 40.",
  ruleLatex: "62 \\cdot 5 = 310",
  naturalOnly: true,
  limit: (a, b) =>
    (isRound(a) && nonzeroDigits(b) <= 2) || (isRound(b) && nonzeroDigits(a) <= 2)
      ? null
      : `This arithmetic unit needs one **round** number (like $5$ or $40$) and the other with at most two nonzero digits. $${a}$ and $${b}$ are too complex. Regroup or factor first.`,
});

const aluArithmetic = makeAlu({
  id: "alu_arithmetic",
  name: "Arithmetic",
  description: "Compute a single operation between two numbers: 60 · 5 = 300.",
  ruleLatex: "60 \\cdot 5 = 300",
});

export default [
  base10Decompose,
  intFactor,
  aluRound,
  aluOneRound,
  aluArithmetic,
  ...defineRules([
    {
      id: "eq_symmetric",
      name: "Symmetry of Equality",
      chapter: CH1,
      section: "Equations",
      description: "If a = b, then b = a.",
      lhs: "a = b",
      rhs: "b = a",
    },
  ]),
] satisfies TacticPlugin[];
