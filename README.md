# Algebra Moves: The Lattice

Learn algebraic manipulation as a game of strict, legal moves, like chess. Each step rewrites one
sub-expression with one named rule from AoPS *Pre-Algebra*.

**Play it:** https://jurisjunction.github.io/algebra-moves/ (progress is saved in your browser).

It has two modes:
- **Campaign**: a text-based sci-fi RPG. An ancient alien computer, the Custodian, only runs
  rewrites it can justify. You start with a single axiom, practise it on problems ("registers"),
  and unlock new modules. Techniques you've practised enough compile into tools and daemons. Each
  AoPS chapter is a sector of the ship. Ch. 1 is playable, and so are §2.1–2.2 (Squares, Higher Exponents) of Ch. 2. See
  [docs/STORY.md](docs/STORY.md).
- **Simulator**: every rule, any problem, nothing recorded.

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # engine, rules, and campaign checks (every problem solvable at exactly par)
npm run build
```

## How to play

1. Pick a preset or type your own problem (`62 * 5`, `3(x + 2) = 12`, `recip(5) * 5`).
2. Click part of the latest step to select it. Click it again to select the enclosing expression
   (↑ also moves up, and Esc selects everything).
3. Pick a move. Legal moves for the selection are highlighted and listed under **Legal now**.
   Picking an illegal move explains why it doesn't fit.

Notation follows the book:
- `a / b` is division, shown as a ÷ b.
- `recip(x)` is the reciprocal, shown as 1/x.
- `-x` is negation, which is different from subtraction `a - b`.
- `a^2` is a power. Powers bind tighter than negation, so `-2^2` is `-(2^2)`, not `(-2)^2`.

Rules match only the literal form the book states. For example, "Multiplying by 1" is `1a = a`, so
`a·1` needs the Commutative Property first. Moves that introduce terms (like `a → a + 0`) are hidden
until you turn on **Introducing moves**.

## Architecture

```
src/
  types/tactic.ts        TacticPlugin, RuleSpec, State
  engine/                rule-agnostic core
    parse.ts             input → normalized mathjs AST (no evaluate/simplify anywhere)
    pattern.ts           pattern matching / instantiation for RuleSpecs
    defineRule.ts        RuleSpec → TacticPlugin[] (reverse moves, variants, nonzero guards)
    latex.ts             AST → LaTeX with clickable paths; parentheses mirror the tree
    registry.ts          TacticRegistry singleton
    loader.ts            auto-registers every src/tactics/*.ts default export
    transformer.ts       clone → locate → canApply → apply → splice → append history
  tactics/               one file per AoPS section: the only place rules live
  engine/solver.ts       breadth-first search over legal moves (hints, par verification)
  problems/presets.ts    simulator presets
  components/            shared UI: Workspace (history + tactic drawer), selection, KaTeX
  sandbox/               simulator mode
  campaign/
    types.ts             ChapterDef, MissionDef, ProblemDef, SkillDef, Line
    outline.ts           all 14 sectors (teasers for chapters without data yet)
    chapters/ch1.ts      playable chapter: skills, missions, problems, dialogue
    index.ts             auto-loads chapters/*.ts
    progress.ts          pure game logic: grants, compiling, gating, stars/XP, persistence
    CampaignView.tsx     story sequencing; components/ holds the map, mission, dialogue, instruction set
```

## Adding an AoPS section

Create a file in `src/tactics/` whose default export is `TacticPlugin[]`. Filename order sets the
drawer order (e.g. `ch2_01_fractions.ts`). No other file needs to change.

Most rules are identities, so declare them as data:

```ts
import { defineRules } from "../engine/defineRule";

export default defineRules([
  {
    id: "frac_mult",
    name: "Multiplying Fractions",
    chapter: "AoPS Ch 2: Fractions",
    section: "Multiplication",
    description: "(a ÷ b)(c ÷ d) = (ac) ÷ (bd).",
    lhs: "(a / b) * (c / d)",
    rhs: "(a * c) / (b * d)",
    nonzero: ["b", "d"],   // a literal 0 is refused; a symbolic one adds "assuming b ≠ 0"
    bidirectional: true,   // also registers frac_mult_rev
    everywhere: true,      // also registers "(everywhere)" macros that rewrite every match in the selection
  },
]);
```

Pattern syntax: single letters bind any sub-expression, and a repeated letter must match the same
sub-expression. Numbers are literals. Use `recip(x)` for 1/x and `a = b` for equations. Use
`variants` for a rule with several possible results; the user picks one. Use `pitfalls` for a
specific explanation of a common mistake.

For rules that aren't a single pattern, implement `TacticPlugin` directly. See
`ch1_03_distribution.ts` (n-ary distribution and factoring) and `ch1_90_tools.ts` (arithmetic and
integer factoring with a parameter prompt).

## Adding a campaign chapter

Once the chapter's rules exist in `src/tactics/`, add `src/campaign/chapters/chN.ts` exporting a
`ChapterDef` (see `ch1.ts`). It's picked up automatically, and the sector's outline entry becomes
playable. A chapter declares:

- **skills**: modules that group tactic ids. A skill is granted by a mission (`grants`) or compiled
  by the player (`compile: { uses, missions }`). `supersedes` hides older tools, e.g. ALU tiers.
  Kinds are `axiom`, `tool`, `daemon`, and `theorem`. A theorem is a statement the player proved in
  a mission (e.g. `(a + 1)² = a² + 2a + 1`), so it compiles from that mission alone.
- **missions**: usually one or more per AoPS section, each with a briefing, a debrief, and
  problems. `requires` gates a mission on a compiled skill, `boss` marks the review mission, and
  `optional` marks challenge problems.
- **problems**: `start`, `goal` (`match` an expression, reduce to a `value`, or `solve` an
  equation), and `par`. `forbid` takes skills offline for one problem. A problem that needs
  free-form input (rearrangements) needs an authored `solution`. So does a problem too wide for
  the search budget; say in a comment why its length is minimal.

`npm test` then checks the chapter. It simulates a player who plays in order, compiles modules as
soon as they're ready, and solves each problem optimally. Every problem must be reachable with
exactly the skills that player has, and its `par` must equal the true minimum. The story plan for
future chapters is in [docs/STORY.md](docs/STORY.md).

Campaign progress is saved in the browser's `localStorage`.

## Deployment

Every push to `main` or `feat/lattice-campaign` runs `.github/workflows/pages.yml`: tests, build,
and publish to GitHub Pages at https://jurisjunction.github.io/algebra-moves/. A failing test
blocks the deploy, and the live site keeps the last good version. Pages uses the "GitHub Actions"
source, and the `github-pages` environment allows both branches. The build uses a relative
`base`, so it works under the `/algebra-moves/` subpath.
