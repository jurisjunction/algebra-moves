import { defineRules } from "../engine/defineRule";
import { CH1 } from "./_chapters";

const section = "Multiplication";

export default defineRules([
  {
    id: "mult_comm",
    name: "Multiplication is Commutative",
    chapter: CH1,
    section,
    description: "Swap the order of the two factors: ab = ba.",
    lhs: "a * b",
    rhs: "b * a",
  },
  {
    id: "mult_assoc",
    name: "Multiplication is Associative",
    chapter: CH1,
    section,
    description: "Regroup a product of three numbers: (ab)c = a(bc).",
    lhs: "(a * b) * c",
    rhs: "a * (b * c)",
    bidirectional: true,
  },
  {
    id: "mult_one",
    name: "Multiplying by 1",
    chapter: CH1,
    section,
    description: "Multiplying by 1 does not change a number: 1a = a.",
    lhs: "1 * a",
    rhs: "a",
    bidirectional: true,
    reverseName: "Multiplying by 1 (introduce 1·)",
  },
  {
    id: "mult_zero",
    name: "Multiplying by Zero",
    chapter: CH1,
    section,
    description: "Any number times 0 is 0: 0x = 0.",
    lhs: "0 * x",
    rhs: "0",
  },
]);
