import type { MathNode } from "mathjs";
import type { TacticPlugin } from "../types/tactic";
import { buildLeft, flattenLeft, getChildren, isOp, mul, nodesEqual } from "../engine/ast";
import { defineRules } from "../engine/defineRule";
import { toLatex } from "../engine/latex";
import { CH1 } from "./_chapters";

const section = "Distribution";

type Side = "left" | "right";

/** The common factor sits on the left of each product (a·b) or on the right (b·a). */
const factorOf = (p: MathNode, side: Side) => getChildren(p)[side === "left" ? 0 : 1];
const otherOf = (p: MathNode, side: Side) => getChildren(p)[side === "left" ? 1 : 0];

function distribute(side: Side): TacticPlugin {
  const sumIndex = side === "left" ? 1 : 0;
  return {
    id: `distribute_${side}`,
    name: side === "left" ? "Distributive Property" : "Distributive Property (sum on the left)",
    chapter: CH1,
    section,
    category: "axiom",
    direction: "forward",
    description:
      side === "left"
        ? "Multiplication distributes over addition: a(b + c + …) = ab + ac + …"
        : "Multiplication distributes over addition: (b + c + …)a = ba + ca + …",
    ruleLatex: side === "left" ? "a(b + c + \\cdots) = ab + ac + \\cdots" : "(b + c + \\cdots)a = ba + ca + \\cdots",
    canApply: (node) => isOp(node, "multiply") && isOp(node.args[sumIndex], "add"),
    explainMismatch: (node) => {
      if (isOp(node, "multiply") && isOp(node.args[1 - sumIndex], "add")) {
        return `Here the sum is the ${side === "left" ? "first" : "second"} factor. Use the other form of the Distributive Property.`;
      }
      if (isOp(node, "multiply") && isOp(node.args[sumIndex], "subtract")) {
        return "That factor is a difference, not a sum. Use Multiplication Distributes over Subtraction.";
      }
      return `The Distributive Property needs a product where the ${side === "left" ? "second" : "first"} factor is a sum, like $${side === "left" ? "a(b+c)" : "(b+c)a"}$. The selected expression $${toLatex(node)}$ is not.`;
    },
    apply: (node) => {
      const args = getChildren(node);
      const a = args[1 - sumIndex];
      const terms = flattenLeft(args[sumIndex], "add");
      return buildLeft(
        "add",
        terms.map((t) => (side === "left" ? mul(a.cloneDeep(), t.cloneDeep()) : mul(t.cloneDeep(), a.cloneDeep()))),
      );
    },
  };
}

function commonFactorTerms(node: MathNode, side: Side): MathNode[] | null {
  if (!isOp(node, "add")) return null;
  const terms = flattenLeft(node, "add");
  if (terms.length < 2 || !terms.every((t) => isOp(t, "multiply"))) return null;
  const a = factorOf(terms[0], side);
  return terms.every((t) => nodesEqual(factorOf(t, side), a)) ? terms : null;
}

function factor(side: Side): TacticPlugin {
  return {
    id: `factor_${side}`,
    name: side === "left" ? "Factoring (common factor on the left)" : "Factoring (common factor on the right)",
    chapter: CH1,
    section,
    category: "axiom",
    direction: "reverse",
    description:
      side === "left"
        ? "Pull out a common factor: ab + ac + … = a(b + c + …)."
        : "Pull out a common factor: ba + ca + … = (b + c + …)a.",
    ruleLatex: side === "left" ? "ab + ac + \\cdots = a(b + c + \\cdots)" : "ba + ca + \\cdots = (b + c + \\cdots)a",
    canApply: (node) => commonFactorTerms(node, side) !== null,
    explainMismatch: (node) => {
      if (!isOp(node, "add")) return `Factoring needs a sum of products. The selected expression $${toLatex(node)}$ is not a sum.`;
      if (commonFactorTerms(node, side === "left" ? "right" : "left")) {
        return `The common factor is on the ${side === "left" ? "right" : "left"} of each product. Use the other Factoring move.`;
      }
      return `Every term of the sum must be a product with the same ${side === "left" ? "first" : "second"} factor, like $${side === "left" ? "ab + ac" : "ba + ca"}$.`;
    },
    apply: (node) => {
      const terms = commonFactorTerms(node, side)!;
      const a = factorOf(terms[0], side).cloneDeep();
      const inner = buildLeft("add", terms.map((t) => otherOf(t, side).cloneDeep()));
      return side === "left" ? mul(a, inner) : mul(inner, a);
    },
  };
}

export default [
  distribute("left"),
  distribute("right"),
  factor("left"),
  factor("right"),
  ...defineRules([
    {
      id: "dist_sub_left",
      name: "Multiplication Distributes over Subtraction",
      chapter: CH1,
      section,
      description: "a(b − c) = ab − ac.",
      lhs: "a * (b - c)",
      rhs: "a * b - a * c",
      bidirectional: true,
      reverseName: "Factoring a Difference (left)",
    },
    {
      id: "dist_sub_right",
      name: "Multiplication Distributes over Subtraction (difference on the left)",
      chapter: CH1,
      section,
      description: "(b − c)a = ba − ca.",
      lhs: "(b - c) * a",
      rhs: "b * a - c * a",
      bidirectional: true,
      reverseName: "Factoring a Difference (right)",
    },
  ]),
] satisfies TacticPlugin[];
