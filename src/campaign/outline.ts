import type { ChapterOutline } from "./types";

/**
 * The full planned arc, one sector per AoPS Pre-Algebra chapter. A chapter becomes
 * playable when `src/campaign/chapters/chN.ts` exists; until then the map shows the teaser.
 * See docs/STORY.md for the story bible.
 */
export const OUTLINE: ChapterOutline[] = [
  {
    number: 1,
    codename: "COLD BOOT",
    aopsTitle: "Properties of Arithmetic",
    teaser: "The Custodian remembers nothing but its first law: I do not guess. Rebuild its kernel, one axiom at a time.",
  },
  {
    number: 2,
    codename: "THE STACK",
    aopsTitle: "Exponents",
    teaser: "Below the kernel, a reactor that multiplies its own output. Tame repeated multiplication before it tames you.",
  },
  {
    number: 3,
    codename: "THE PRIME VAULT",
    aopsTitle: "Number Theory",
    teaser: "The Lattice's memory sleeps behind doors keyed by primes, and the rings only align at their common multiples.",
  },
  {
    number: 4,
    codename: "THE PARTITION",
    aopsTitle: "Fractions",
    teaser: "Nineteen hours of air, split across too many cells. Learn to divide what cannot be divided evenly.",
  },
  {
    number: 5,
    codename: "THE BALANCE",
    aopsTitle: "Equations and Inequalities",
    teaser: "The navigation core knows where it wants to go, but not where it is. Solve for the unknown: yourself.",
  },
  {
    number: 6,
    codename: "MOTH'S LESSON",
    aopsTitle: "Decimals",
    teaser: "MOTH's rounding errors nearly vent the airlock. Precision is a kind of honesty.",
  },
  {
    number: 7,
    codename: "THE DRIVE",
    aopsTitle: "Ratios, Conversions, and Rates",
    teaser: "Alien fuel, human engines. Every unit must be converted, and every rate must hold.",
  },
  {
    number: 8,
    codename: "SHIELDS",
    aopsTitle: "Percents",
    teaser: "A stellar storm is coming. Shield integrity is measured in hundredths, and so is survival.",
  },
  {
    number: 9,
    codename: "THE MIRROR WELL",
    aopsTitle: "Square Roots",
    teaser: "A gravity lens that squares everything it touches. To see through it, you must learn to undo it.",
  },
  {
    number: 10,
    codename: "STAR COMPASS",
    aopsTitle: "Angles",
    teaser: "The Lattice is tumbling. Find the angles between the beams, and point it toward home.",
  },
  {
    number: 11,
    codename: "THE HULL",
    aopsTitle: "Perimeter and Area",
    teaser: "Micrometeorites have opened the hull. Measure every breach before the patch can be grown.",
  },
  {
    number: 12,
    codename: "JUMP GEOMETRY",
    aopsTitle: "Right Triangles and Quadrilaterals",
    teaser: "The jump drive plots courses as triangles. One wrong hypotenuse and you arrive inside a star.",
  },
  {
    number: 13,
    codename: "CENSUS OF ECHOES",
    aopsTitle: "Data and Statistics",
    teaser: "The builders left records. The averages say they were fine. The averages are lying.",
  },
  {
    number: 14,
    codename: "THE LAST JUMP",
    aopsTitle: "Counting",
    teaser: "Count every path home. Weigh every chance. Then decide who comes with you.",
  },
];
