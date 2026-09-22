# CLAUDE.md

Algebra Moves / **THE LATTICE**: learn algebra as strict, legal rewrites (AoPS *Pre-Algebra*),
wrapped in a sci-fi RPG. React + TypeScript + Vite + Tailwind v4, mathjs (AST only) + KaTeX.

Read next, as needed:
- `docs/SPEC.md` — what the thing is, data contracts, design decisions and why.
- `docs/STATUS.md` — **where we left off and what's next. Start here when resuming.**
- `docs/STORY.md` — story bible: arc, characters, the secret, pedagogy.
- `README.md` — player-facing docs and how to add rules/chapters.

## Commands

```bash
npm run dev      # http://localhost:5173
npm test         # vitest: engine, rules, campaign (~178 tests, ~30s)
npm run build    # tsc -b && vite build
```

Browser checks (no browser is installed by default; Playwright's chromium lives in the
scratchpad). Launch the dev server, then drive it with a small Playwright script in the
scratchpad directory, screenshot, and **look at the screenshot**. Existing scripts there:
`playthrough.mjs` replays the whole campaign through the UI from solver-generated solutions.

## Hard invariants

1. **Never** `math.evaluate`, `math.simplify`, or any whole-tree collapse. Arithmetic happens only
   in the ALU tactics, one operation at a time.
2. The engine (`src/engine/`) stays rule-agnostic. Rules live only in `src/tactics/*.ts`, campaign
   content only in `src/campaign/chapters/*.ts`. Both are auto-loaded by glob; adding a file is
   the whole integration step.
3. Rules match the **literal form the book states** (`1·a = a` does not match `a·1`). Strictness is
   the game.
4. Notation follows the book: `/` is division (÷), `recip(x)` is the reciprocal (1/x), `-x` is
   negation and is distinct from subtraction. Parentheses are stripped at parse; the tree *is* the
   grouping, and the renderer re-derives brackets.
5. Every campaign problem must be solvable at **exactly** its par by the simulated reference
   player (`src/campaign/__tests__/simulate.ts`). The test fails if the solver beats par or can't
   reach it.

## Conventions

- Match surrounding code: comments explain *why*, not *what*; no decorative headers in code.
- Use the helpers in `engine/ast.ts` (mathjs's node generics are hostile; the helpers cast once).
- New rules: prefer a declarative `RuleSpec` (`defineRules`) over a hand-written plugin.
- Tailwind dark palette: slate surfaces, cyan accent, emerald = legal/success, amber = diagnostic,
  violet = Custodian/hints, fuchsia = daemons. Icons from lucide-react.
- Tests accompany behavior: one positive + one negative per rule, plus a campaign entry.

## Traps hit before (don't repeat)

- **Escaping.** When editing TS with python/sed heredocs, `\t`/`\to`/`\text` in a template literal
  becomes a tab. A test asserts no control chars in `ruleLatex`.
- **Effects returning promises.** `scrollIntoView({behavior:"smooth"})` returns a promise in newer
  Chromium; React then throws "destroy is not a function". Wrap effect bodies in braces.
- **Keyboard shortcuts** must ignore text entry but not checkboxes (`TEXT_ENTRY` selector).
- **KaTeX** runs with `trust` limited to `\htmlData`/`\htmlClass`; paths are encoded as `p0-1`.
- **Solver** skips `introduce` moves and free-form (`expression`) params; problems needing a
  rearrangement must carry an authored `solution`.
- Don't let a stronger tool trivialize a lesson: use a problem's `forbid` (in-story: "offline").

## Git

Work on a feature branch (currently `feat/lattice-campaign`), never commit to `main` unasked.
Commit/push only when asked. Attribution:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```
