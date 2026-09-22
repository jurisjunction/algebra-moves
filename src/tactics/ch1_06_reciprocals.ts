import { defineRules } from "../engine/defineRule";
import { CH1 } from "./_chapters";

const section = "Reciprocals";

export default defineRules([
  {
    id: "recip_inverse",
    name: "Multiplicative Inverse",
    chapter: CH1,
    section,
    description: "The reciprocal of x is the number with (1/x)·x = 1. The reciprocal of 0 is undefined.",
    lhs: "recip(x) * x",
    rhs: "1",
    nonzero: ["x"],
  },
  {
    id: "recip_recip",
    name: "Reciprocal of Reciprocal",
    chapter: CH1,
    section,
    description: "For nonzero x, the reciprocal of 1/x is x.",
    lhs: "recip(recip(x))",
    rhs: "x",
    nonzero: ["x"],
    bidirectional: true,
    reverseName: "Reciprocal of Reciprocal (introduce)",
  },
  {
    id: "recip_product",
    name: "Reciprocal of Product",
    chapter: CH1,
    section,
    description: "For nonzero x and y: (1/x)·(1/y) = 1/(xy).",
    lhs: "recip(x) * recip(y)",
    rhs: "recip(x * y)",
    nonzero: ["x", "y"],
    bidirectional: true,
  },
  {
    id: "recip_neg",
    name: "Reciprocal of Negation",
    chapter: CH1,
    section,
    description: "For nonzero x: 1/(−x) = −(1/x).",
    lhs: "recip(-x)",
    rhs: "-recip(x)",
    nonzero: ["x"],
    bidirectional: true,
  },
]);
