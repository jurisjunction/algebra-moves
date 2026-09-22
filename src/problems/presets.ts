export interface Preset {
  id: string;
  input: string;
  label: string;
  goal: string;
}

export const PRESETS: Preset[] = [
  {
    id: "62x5",
    input: "62 * 5",
    label: "62 · 5",
    goal: "Base-10 decomposition, then the Distributive Property.",
  },
  {
    id: "4div2",
    input: "4 / 2",
    label: "4 ÷ 2",
    goal: "Definition of Division, factor 4, then inverses and identities.",
  },
  {
    id: "25x28",
    input: "25 * 28",
    label: "25 · 28",
    goal: "Factor 28 to group 25 · 4, then use associativity.",
  },
  {
    id: "regroup",
    input: "268 + 1375 + 6179 - 168 - 1275 - 6079",
    label: "268 + 1375 + 6179 − 168 − 1275 − 6079",
    goal: "Rearrange Terms to pair up numbers that subtract nicely.",
  },
  {
    id: "factor51",
    input: "51 * 9 + 51 * 31",
    label: "51 · 9 + 51 · 31",
    goal: "Pull out the common factor 51 first.",
  },
  {
    id: "negneg",
    input: "(-7) * (-8) - (-6)",
    label: "(−7)(−8) − (−6)",
    goal: "Negation rules: negation times negation, subtraction of negation.",
  },
  {
    id: "eq1",
    input: "x + 3 = 7",
    label: "x + 3 = 7",
    goal: "Use the addition–subtraction relation to isolate x.",
  },
  {
    id: "eq2",
    input: "3(x + 2) = 12",
    label: "3(x + 2) = 12",
    goal: "Undo the multiplication with the multiplication–division relation.",
  },
];
