import type { MathNode } from "mathjs";
import type { TacticParams, TacticPlugin } from "../types/tactic";
import { getChildren, isOp, structKey } from "../engine/ast";
import { TacticError } from "../engine/errors";
import { toInput } from "../engine/format";
import { toLatex } from "../engine/latex";
import { parseProblem, ParseError } from "../engine/parse";
import { CH1 } from "./_chapters";

/**
 * Macros: the Commutative and Associative Properties together let us reorder and regroup
 * a sum (or product) any way we like. Rather than dozens of single swaps, the learner types
 * the arrangement they want, and the engine checks that it uses exactly the same terms.
 */

const section = "Rearranging";

interface Term {
  node: MathNode;
  sign: 1 | -1;
}

/** Signed terms of a sum, treating a − b as a + (−b) and −x as a term with a minus sign. */
function sumTerms(n: MathNode, sign: 1 | -1 = 1, out: Term[] = []): Term[] {
  if (isOp(n, "add")) {
    sumTerms(n.args[0], sign, out);
    sumTerms(n.args[1], sign, out);
  } else if (isOp(n, "subtract")) {
    sumTerms(n.args[0], sign, out);
    sumTerms(n.args[1], sign === 1 ? -1 : 1, out);
  } else if (isOp(n, "unaryMinus")) {
    sumTerms(n.args[0], sign === 1 ? -1 : 1, out);
  } else {
    out.push({ node: n, sign });
  }
  return out;
}

function productFactors(n: MathNode, out: Term[] = []): Term[] {
  if (isOp(n, "multiply")) getChildren(n).forEach((c) => productFactors(c, out));
  else out.push({ node: n, sign: 1 });
  return out;
}

const termKey = (t: Term) => `${t.sign}|${structKey(t.node)}`;

/** Terms in `a` that are not matched one-for-one in `b`. */
function difference(a: Term[], b: Term[]): Term[] {
  const counts = new Map<string, number>();
  b.forEach((t) => counts.set(termKey(t), (counts.get(termKey(t)) ?? 0) + 1));
  return a.filter((t) => {
    const c = counts.get(termKey(t)) ?? 0;
    if (c === 0) return true;
    counts.set(termKey(t), c - 1);
    return false;
  });
}

interface Kind {
  id: string;
  name: string;
  noun: string;
  isChain: (n: MathNode) => boolean;
  terms: (n: MathNode) => Term[];
  showTerm: (t: Term) => string;
  description: string;
  ruleLatex: string;
  example: string;
}

const SUM: Kind = {
  id: "rearrange_sum",
  name: "Rearrange Terms",
  noun: "sum",
  isChain: (n) => isOp(n, "add") || isOp(n, "subtract"),
  terms: (n) => sumTerms(n),
  showTerm: (t) => `${t.sign === 1 ? "+" : "-"}${toLatex(t.node)}`,
  description:
    "Addition is commutative and associative, so the terms of a sum can be reordered and regrouped freely. Subtracting b means adding −b, so each term keeps its sign.",
  ruleLatex: "a - b + c = (a + c) - b",
  example: "(268 - 168) + (1375 - 1275)",
};

const PRODUCT: Kind = {
  id: "rearrange_product",
  name: "Rearrange Factors",
  noun: "product",
  isChain: (n) => isOp(n, "multiply"),
  terms: (n) => productFactors(n),
  showTerm: (t) => toLatex(t.node),
  description:
    "Multiplication is commutative and associative, so the factors of a product can be reordered and regrouped freely.",
  ruleLatex: "abc = (ac)b",
  example: "(25 * 4) * 7",
};

function rearrange(k: Kind): TacticPlugin {
  const check = (node: MathNode, params: TacticParams): { result: MathNode } | { error: string } => {
    let target: MathNode;
    try {
      target = parseProblem(params.expr ?? "");
    } catch (e) {
      return { error: e instanceof ParseError ? e.message : String(e) };
    }
    if (!k.isChain(target)) {
      return { error: `The result must still be a ${k.noun}. Only the order and grouping may change.` };
    }
    if (structKey(target) === structKey(node)) return { error: "That is the same expression. Change the order or grouping." };
    const before = k.terms(node);
    const after = k.terms(target);
    const missing = difference(before, after);
    const extra = difference(after, before);
    if (missing.length || extra.length) {
      const parts: string[] = [];
      if (missing.length) parts.push(`missing $${missing.map(k.showTerm).join(",\\ ")}$`);
      if (extra.length) parts.push(`not in the original: $${extra.map(k.showTerm).join(",\\ ")}$`);
      return {
        error: `A rearrangement must use exactly the same ${k.noun === "sum" ? "terms (with their signs)" : "factors"}. ${parts.join("; ")}.`,
      };
    }
    return { result: target };
  };

  return {
    id: k.id,
    name: k.name,
    chapter: CH1,
    section,
    category: "macro",
    direction: "forward",
    description: k.description,
    ruleLatex: k.ruleLatex,
    paramSchema: {
      type: "expression",
      prompt: `Rewrite this ${k.noun} in the order and grouping you want. Use parentheses to group, e.g. ${k.example}.`,
    },
    paramDefaults: (node) => ({ expr: toInput(node) }),
    canApply: (node) => k.isChain(node) && k.terms(node).length >= 2,
    explainMismatch: (node) =>
      `**${k.name}** works on a ${k.noun}. Select a whole ${k.noun} like $${k.ruleLatex.split("=")[0]}$. The selected expression $${toLatex(node)}$ is not one.`,
    validateParams: (node, params) => {
      const r = check(node, params);
      return "error" in r ? r.error : null;
    },
    apply: (node, params) => {
      const r = check(node, params ?? {});
      if ("error" in r) throw new TacticError(r.error);
      return r.result;
    },
  };
}

export default [rearrange(SUM), rearrange(PRODUCT)] satisfies TacticPlugin[];
