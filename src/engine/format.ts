import type { MathNode } from "mathjs";
import { isConst, isFn, isOp, isSym } from "./ast";

const prec = (n: MathNode): number =>
  !isOp(n) ? 9 : n.fn === "equal" ? 0 : n.fn === "add" || n.fn === "subtract" ? 1 : n.fn === "multiply" || n.fn === "divide" ? 2 : n.fn === "unaryMinus" ? 3 : 4;

/** AST → text that `parseProblem` reads back as the same tree (used to prefill editable input). */
export function toInput(n: MathNode): string {
  const wrap = (c: MathNode, parens: boolean) => (parens ? `(${toInput(c)})` : toInput(c));
  if (isConst(n)) return String(n.value);
  if (isSym(n)) return n.name;
  if (isFn(n)) return `${n.fn.name}(${n.args.map(toInput).join(", ")})`;
  if (!isOp(n)) return n.toString();
  const [l, r] = n.args;
  const neg = (c: MathNode) => isOp(c, "unaryMinus");
  switch (n.fn) {
    case "equal":
      return `${toInput(l)} = ${toInput(r)}`;
    case "add":
    case "subtract":
      return `${wrap(l, prec(l) < 1)} ${n.fn === "add" ? "+" : "-"} ${wrap(r, prec(r) <= 1 || neg(r))}`;
    case "multiply":
    case "divide":
      return `${wrap(l, prec(l) < 2 || neg(l))} ${n.fn === "multiply" ? "*" : "/"} ${wrap(r, prec(r) <= 2 || neg(r))}`;
    case "unaryMinus":
      return `-${wrap(l, isOp(l))}`;
    case "pow":
      return `${wrap(l, isOp(l) || isFn(l))}^${wrap(r, isOp(r))}`;
  }
  return n.toString();
}
