import { defineRules } from "../engine/defineRule";
import { CH1 } from "./_chapters";

const section = "Addition";

export default defineRules([
  {
    id: "add_comm",
    name: "Addition is Commutative",
    chapter: CH1,
    section,
    description: "Swap the order of the two addends: a + b = b + a.",
    lhs: "a + b",
    rhs: "b + a",
  },
  {
    id: "add_assoc",
    name: "Addition is Associative",
    chapter: CH1,
    section,
    description: "Regroup a sum of three numbers: (a + b) + c = a + (b + c).",
    lhs: "(a + b) + c",
    rhs: "a + (b + c)",
    bidirectional: true,
  },
  {
    id: "add_zero",
    name: "Adding Zero",
    chapter: CH1,
    section,
    description: "Adding 0 does not change a number: a + 0 = a.",
    lhs: "a + 0",
    rhs: "a",
    bidirectional: true,
    reverseName: "Adding Zero (introduce + 0)",
  },
]);
