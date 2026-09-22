import type { MathNode } from "mathjs";
import type { TacticPlugin } from "../types/tactic";
import { isConst, isOp, num } from "../engine/ast";
import { defineRules } from "../engine/defineRule";
import { TacticError } from "../engine/errors";
import { toLatex } from "../engine/latex";
import { CH2 } from "./_chapters";

const section = "Squares";

const NOT_SUM_OF_SQUARES =
  "The square of a sum is **not** the sum of the squares: $(5 + 6)^2 = 121$, but $5^2 + 6^2 = 61$. Squares pass through products and quotients, never through sums or differences.";

const NEGATION_OF_SQUARE =
  "This is the **negation of a square**, $-(a^2)$, not the square of a negation, $(-a)^2$. Powers come before negation, so $-2^2$ means $-(2^2) = -4$. Square first, then negate.";

// The book's table of perfect squares, 0² through 29².
const TABLE_MAX = 29;

const tableBase = (n: MathNode): number | null => {
  if (!isOp(n, "pow")) return null;
  const [b, e] = n.args;
  if (!isConst(e) || e.value !== 2 || !isConst(b)) return null;
  return Number.isInteger(b.value) && b.value >= 0 && b.value <= TABLE_MAX ? b.value : null;
};

const squareTable: TacticPlugin = {
  id: "square_table",
  name: "Square Table",
  chapter: CH2,
  section,
  category: "alu",
  direction: "forward",
  description: `Look up the square of a whole number from 0 to ${TABLE_MAX}: 12² = 144.`,
  ruleLatex: "12^2 = 144",
  canApply: (node) => tableBase(node) !== null,
  explainMismatch: (node) =>
    isOp(node, "pow") && isConst(node.args[0]) && isConst(node.args[1]) && node.args[1].value === 2
      ? `The table only holds the squares of $0$ through $${TABLE_MAX}$. For $${toLatex(node)}$, write the square as a product, or find a smarter route.`
      : `The Square Table works on the square of a single whole number, like $12^2$. $${toLatex(node)}$ is not one.`,
  apply: (node) => {
    const b = tableBase(node);
    if (b === null) throw new TacticError("Not in the table.");
    return num(b * b);
  },
};

export default [
  ...defineRules([
    {
      id: "square_def",
      name: "Definition of Square",
      chapter: CH2,
      section,
      description: "The square of a is a · a.",
      lhs: "a^2",
      rhs: "a * a",
      bidirectional: true,
      reverseName: "Definition of Square (collect a · a)",
    },
    {
      id: "square_neg",
      name: "Square of Negation",
      chapter: CH2,
      section,
      description: "(−a)² = a². Squaring a negation gives the same result as squaring the number.",
      lhs: "(-a)^2",
      rhs: "a^2",
      pitfalls: [{ when: "-(a^2)", message: NEGATION_OF_SQUARE }],
    },
    {
      id: "square_product",
      name: "Square of Product",
      chapter: CH2,
      section,
      description: "(ab)² = a²b².",
      lhs: "(a * b)^2",
      rhs: "a^2 * b^2",
      bidirectional: true,
      pitfalls: [
        { when: "(a + b)^2", message: NOT_SUM_OF_SQUARES },
        { when: "(a - b)^2", message: NOT_SUM_OF_SQUARES },
      ],
    },
    {
      id: "square_recip",
      name: "Square of Reciprocal",
      chapter: CH2,
      section,
      description: "For nonzero a: (1/a)² = 1/a².",
      lhs: "recip(a)^2",
      rhs: "recip(a^2)",
      nonzero: ["a"],
      bidirectional: true,
    },
    {
      id: "square_quotient",
      name: "Square of Quotient",
      chapter: CH2,
      section,
      description: "For nonzero b: (a ÷ b)² = a² ÷ b².",
      lhs: "(a / b)^2",
      rhs: "a^2 / b^2",
      nonzero: ["b"],
      bidirectional: true,
      pitfalls: [
        { when: "(a + b)^2", message: NOT_SUM_OF_SQUARES },
        { when: "(a - b)^2", message: NOT_SUM_OF_SQUARES },
      ],
    },
    {
      // A theorem, not an axiom: the campaign has the player prove it before it compiles.
      id: "square_next",
      name: "Next Square",
      chapter: CH2,
      section,
      category: "macro",
      description: "(a + 1)² = a² + 2a + 1, or equivalently a² + a + (a + 1). Step from one perfect square to the next.",
      lhs: "(a + 1)^2",
      variants: [
        { label: "a² + 2a + 1", rhs: "a^2 + 2 * a + 1" },
        { label: "a² + a + (a + 1)", rhs: "a^2 + a + (a + 1)" },
      ],
      pitfalls: [
        {
          when: "(a + b)^2",
          message: "**Next Square** needs the second addend to be exactly $1$, as in $(a + 1)^2$. Split a number by place value to make one, e.g. $101 = 100 + 1$.",
        },
      ],
    },
  ]),
  squareTable,
] satisfies TacticPlugin[];
