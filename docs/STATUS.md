# STATUS — resume here

**Updated:** 2026-09-22 · **Branch:** `feat/lattice-campaign` (not merged to `main`) ·
**Tests:** 294 passing · **Build:** clean · **Live:** https://jurisjunction.github.io/algebra-moves/
(auto-deployed by Actions on every push to `main` or `feat/lattice-campaign`; repo is public).

Ten-second orientation: `CLAUDE.md` (rules of the road) → this file (where we are) →
`docs/SPEC.md` (contracts) → `docs/STORY.md` (narrative + pedagogy).

## What exists

- **Engine** (`src/engine/`): parse/normalize, immutable path rewriting, own LaTeX renderer with
  clickable paths, declarative rule compiler, registry + glob loaders, BFS solver.
- **Rules** (`src/tactics/`): all of AoPS Ch. 1 (addition, multiplication, distribution, negation,
  subtraction, reciprocals, division), plus rearrange macros, "everywhere" macros, tiered ALU,
  place-value splitter, integer factoring, equality symmetry. **Ch. 2 §2.1** in
  `ch2_01_squares.ts`: definition of square (both ways), square of negation / product / reciprocal /
  quotient (with "not a sum of squares" and "−2² is not (−2)²" pitfalls), the Next Square theorem
  `(a+1)² = a²+2a+1 | a²+a+(a+1)`, and the Square Table (0²–29²). **§2.2** in
  `ch2_02_powers.ts`: definition of power (write out ≤ 12 copies / collect equal factors however
  grouped), a¹ = a, power of negation (even/odd), power of product/reciprocal/quotient, product,
  quotient (m > n only) and power of powers, and the Power Table (≤ 1,000,000, plus its reverse,
  "write as a power of the smallest base").
- **Campaign** (`src/campaign/`): Ch. 1 "COLD BOOT" fully playable (14 missions). **Ch. 2 "THE
  STACK" §2.1–2.2 playable**: missions 2.1a–2.1e and 2.2a–2.2f, 49 registers, compiles
  `sq.table`, `sq.next` (the first **theorem** skill kind), and `pow.table`. The §2.2 skills
  supersede the §2.1 square skills. Interim outro; see rough edges.
- **UI**: dark sci-fi theme; shared `Workspace` for campaign and simulator; click / repeat-click /
  drag / arrow-key selection with breadcrumb; bracket-notation toggle; Theorems section in the
  instruction set.
- **Docs**: `README.md` (play + extend), `docs/SPEC.md`, `docs/STORY.md` (arc, the secret, the
  GEB-influenced pedagogy, planned mechanics).

Verified end to end: Ch. 1 was played through the real UI earlier. All of Ch. 2 (§2.1–2.2) was
replayed through the real UI from solver solutions (seeded save with Ch. 1 done): all 49
registers 3★ at par, three compiles, all debriefs and the outro, no console errors. The production
build was also loaded from a `/algebra-moves/` subpath, as Pages serves it. The §2.1 UI pass found
a real bug, fixed in `index.css`: clicks on a denominator selected the whole fraction (KaTeX vlist
spans overlap).

## Next steps (pick one)

1. **Playtest feedback** from the user's son, who plays the live site (he is reading §2.1–2.2
   for Thursday 2026-09-24). Chapter 2 is gated behind all 14 Ch. 1 missions; a "jump to chapter"
   unlock was offered and not yet requested.
2. **Ch. 2 §2.3–2.4** (zero exponent, negative exponents). Rules in `ch2_03_*.ts`: `pow.zero`
   (a⁰ = 1, "the idle state is one"), negative exponents as reciprocals (a⁻ⁿ = 1/aⁿ, ch. 1
   reciprocals return), and lift the m > n restriction on `pow_sub`. Then **rewrite the ch2
   outro** as the chapter outro, add the boss (2.x Summary) and an optional challenge set (the
   ★ exercises, e.g. 2.2.6(j)–(l), 2.2.11). Consider a `pow-collect` daemon and a "repeated
   addition" move (x + x + x = 3x), which Problems 2.16 and 2.2.3 need and §2.2 skipped.
3. **Unreachable register mechanic** (small, high value; spec in `STORY.md` §"Pedagogical style").
   The §2.1 outro now explicitly sets it up ("true whatever rule you use; I have no module for
   that kind of knowledge"), and "squares are nonnegative" is a ready-made sign invariant.
4. **Interludes.** Short Custodian/MOTH dialogues between chapters whose form mirrors the idea
   (`STORY.md`). Needs a small `interlude` screen in `CampaignView`.

## Open decisions

- Whether `main` should hold this work directly. The feature branch is what's deployed; the
  `github-pages` environment was opened to it so `main` could stay untouched.
- Whether stars should decay on replay (currently best-ever is kept, XP only for improvement).
- How hard later chapters should lean on `forbid` versus designing problems the stronger tools
  can't shortcut. §2.1 uses it for two things: quarantining a law until it's proven, and taking
  the full ALU offline where structure should beat brute force (4²·25², 101²).
- Substitution ("evaluate at x = 3") isn't a move; §2.1 problems start already substituted, with
  the original expression in the flavor text. A `subst` move could come with Ch. 5 (equations).

## Known limits / rough edges

- **Ch. 2 is partial.** Finishing §2.2 marks the chapter complete, and the shared outro screen
  says "SECTOR 02 COMPLETE · RESTORED". Adding §2.3 missions reopens the chapter automatically
  (completion is computed), but the outro text must be rewritten then.
- ALU is whole numbers only; exact division only. Fractions arrive with Ch. 4.
- The solver can't search free-form rearrangements, so such problems need an authored `solution`;
  hints there fall back to the problem's written hint. Three §2.1 arithmetic problems (2.1b-4,
  2.1d-1, 2.1e-2) exceed the search budget and carry authored solutions with a minimality comment.
  The 2.2f problems carry authored solutions because the solver doesn't factor numbers > 10,000.
- Pars assume the reference player compiled available modules. A player who skips compiling can
  still solve everything, but may earn 2★ instead of 3★.
- Bundle is ~1.2 MB (mathjs + KaTeX); the size warning is raised deliberately in `vite.config.ts`.
- **Chapter 2 is gated behind all of Ch. 1** (14 missions). There is no "skip to chapter"
  option; the Simulator has every rule unlocked.
- Browser tooling: Chromium is cached in `~/.cache/ms-playwright`; scripts live in per-session
  scratchpads and don't persist (recipe in `CLAUDE.md`).
- Progress migration: `Progress.version` is 1; a shape change needs a migration or it resets.
