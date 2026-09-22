# STATUS — resume here

**Updated:** 2026-09-22 · **Branch:** `feat/lattice-campaign` (3 commits ahead of `main`, pushed,
**not merged**) · **Tests:** 178 passing · **Build:** clean.

Ten-second orientation: `CLAUDE.md` (rules of the road) → this file (where we are) →
`docs/SPEC.md` (contracts) → `docs/STORY.md` (narrative + pedagogy).

## What exists

- **Engine** (`src/engine/`): parse/normalize, immutable path rewriting, own LaTeX renderer with
  clickable paths, declarative rule compiler, registry + glob loaders, BFS solver.
- **Rules** (`src/tactics/`): all of AoPS Ch. 1 (addition, multiplication, distribution, negation,
  subtraction, reciprocals, division), plus rearrange macros, "everywhere" macros, tiered ALU,
  place-value splitter, integer factoring, equality symmetry.
- **Campaign** (`src/campaign/`): Ch. 1 "COLD BOOT" fully playable: 14 missions incl. boss and an
  optional challenge set, 50+ problems, skills granted/compiled, stars/XP/levels, hints, dialogue,
  instruction set with compile animation, localStorage save. All 14 sectors outlined.
- **UI**: dark sci-fi theme; shared `Workspace` for campaign and simulator; click / repeat-click /
  drag / arrow-key selection with breadcrumb; bracket-notation toggle.
- **Docs**: `README.md` (play + extend), `docs/SPEC.md`, `docs/STORY.md` (arc, the secret, the
  GEB-influenced pedagogy, planned mechanics).

Verified end to end: a Playwright script played the whole chapter through the real UI, 3★ at par
on every problem, no console errors.

## Next steps (pick one)

1. **Merge the branch.** Fast-forward `main` or open a PR. Nothing is merged yet.
2. **Unreachable register mechanic** (small, high value; spec in `STORY.md` §"Pedagogical style").
   Adds `Goal` type `unreachable` + a small invariant vocabulary (parity, divisibility, sign) +
   a checker verifying the invariant holds at the start and survives every allowed tactic, plus a
   "Declare unreachable" UI move. This is the MU-puzzle lesson and the first rehearsal of the
   ending; it's the one theme the engine currently cannot express.
3. **Chapter 2 (Exponents).** Order: rules first (`src/tactics/ch2_*.ts`: `pow.def`, `pow.mul`,
   `pow.pow`, `pow.zero`, `pow.neg`; the renderer already handles `^`), then
   `src/campaign/chapters/ch2.ts` (missions per §2 of the outline, compile a `pow-collect` daemon),
   then run the par check and a UI playthrough. Keep the Ch. 3 foreshadowing beats in mind.
4. **Interludes.** Short Custodian/MOTH dialogues between chapters whose form mirrors the idea
   (`STORY.md`). Needs a small `interlude` screen in `CampaignView`.

## Open decisions

- Whether `main` should hold this work directly (user has pushed only the feature branch so far).
- Whether stars should decay on replay (currently best-ever is kept, XP only for improvement).
- How hard later chapters should lean on `forbid` versus designing problems the stronger tools
  can't shortcut.

## Known limits / rough edges

- ALU is whole numbers only; exact division only. Fractions arrive with Ch. 4.
- The solver can't search free-form rearrangements, so such problems need an authored `solution`;
  hints there fall back to the problem's written hint.
- Pars assume the reference player compiled available modules. A player who skips compiling can
  still solve everything, but may earn 2★ instead of 3★.
- Bundle is ~1 MB (mathjs + KaTeX); the size warning is raised deliberately in `vite.config.ts`.
- No browser is installed in a fresh container: Playwright chromium is installed into the
  scratchpad (see `CLAUDE.md`).
- Progress migration: `Progress.version` is 1; a shape change needs a migration or it resets.
