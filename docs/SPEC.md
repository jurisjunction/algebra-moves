# SPEC: Algebra Moves / THE LATTICE

What the system is, what its parts promise each other, and why the awkward decisions are the way
they are. Story is in `STORY.md`; current state and next steps are in `STATUS.md`.

## 1. Product

Algebraic manipulation as a game of **strict, legal state transitions**, like chess. A problem is
an expression; a move rewrites **one selected sub-expression** using **one named rule** from AoPS
*Pre-Algebra*. Nothing else may change. Two modes:

- **Campaign** (default): a text sci-fi RPG. You start with one axiom and earn modules; practice
  compiles into macros. One sector per AoPS chapter; Ch. 1 playable, 14 outlined.
- **Simulator**: every rule, any problem, no progress recorded.

Design goals, in order: (1) every step is justified and checkable, (2) new AoPS chapters are pure
data drops, (3) mistakes teach, so an illegal move explains itself.

## 2. Architecture

```
src/
  types/tactic.ts    TacticPlugin, RuleSpec, State, NodePath
  engine/            rule-agnostic core (see §3)
  tactics/*.ts       rules; default export TacticPlugin[]; auto-registered by glob
  campaign/          types, outline, chapters/*.ts (auto-loaded), progress.ts, views
  components/        Workspace (history + drawer), MathView, Tex, display prefs
  sandbox/           simulator mode
```

Dependency rule: `components/` and `campaign/` may import `engine/`; `engine/` imports nothing
from them. `engine/` knows no specific rule; `tactics/` knows no UI.

## 3. Engine contracts

**AST.** mathjs nodes, normalized at parse: parentheses removed (structure encodes grouping),
`unaryPlus` dropped, a single `=` becomes an equation node, unsupported syntax rejected.
Representation follows the book: division `a / b` (÷) vs reciprocal `recip(x)` (1/x, a
FunctionNode); negation `-x` vs subtraction `a - b`. `engine/ast.ts` holds all node predicates,
builders, path access (`getAt`/`replaceAt`, immutable), structural equality (`structKey`).

**Tactic plugin** (`types/tactic.ts`) — the extension point:

```ts
canApply(node, ctx?) => boolean          // may this rewrite run here?
apply(node, params?) => MathNode         // the single-step rewrite; may throw TacticError
paramSchema?                             // factors | custom (choices) | expression (free text)
explainMismatch?(node) => string         // educational diagnostic, "$math$" and "**bold**"
validateParams?, sideConditions?, direction?, ruleLatex?, section?
```

**Declarative rules.** Most rules are identities, so they're data (`RuleSpec`) compiled by
`defineRule.ts`: `lhs`/`rhs` patterns (single letters bind any sub-expression; repeats must match
structurally), `bidirectional` (adds the reverse; a bare-variable rhs becomes an `introduce` move,
hidden by default), `variants` (user picks the result), `nonzero` (literal 0 refused, symbolic adds
"assuming x ≠ 0"), `pitfalls` (targeted misconception messages), `everywhere` (adds a macro
applying the rule at every match in the selection).

**Transformer.** clone → locate by path → `canApply` (else diagnostic) → `validateParams` →
`apply` → splice → append `State` to a new history array. States are immutable; undo drops one.

**Renderer.** Own AST → LaTeX pass (not `toTex`) so brackets reflect the real tree, every node
carries `\htmlData{path=…}` for selection, and the focus is highlighted. Default display brackets
every grouping (`(a+b)+c`); a toggle switches to conventional notation.

**Solver.** BFS over legal moves with a visited set (`structKey`), depth and state budgets. Used
for the in-game hint ("Query Custodian", small budget) and in tests to verify pars (large budget).
It skips `introduce` moves and free-form params, and enumerates factor pairs and variant choices.

## 4. Campaign contracts

Data (`campaign/types.ts`): `ChapterDef` → `SkillDef[]` + `MissionDef[]` + dialogue `Line[]`.

- **Skill** = a module grouping tactic ids. Granted by a mission (`grants`) or **compiled** by the
  player (`compile: { uses, missions }`). `supersedes` hides superseded tools (ALU tiers). Kind is
  `axiom`, `tool`, `daemon`, or `theorem` (a statement proved in a mission, compiled by
  `compile.missions` alone; its tactic is an ordinary `RuleSpec`, usually with `variants`).
- **Mission** = briefing, problems, debrief. `requires` gates on a compiled skill; `boss` for
  review; `optional` for challenge sets. Required missions unlock in order; a chapter unlocks when
  the previous one's required missions are done.
- **Problem** = `start`, `goal` (`match` | `value` | `solve`), `par`, optional `flavor`, `hint`,
  `forbid` (skills offline for this problem), `solution` (authored moves when the solver can't
  search them).
- **Progress** (`campaign/progress.ts`, pure + localStorage): owned skills, per-skill usage counts,
  per-problem stars/best moves, missions started/done, chapters seen, XP. Stars: ≤ par = 3, ≤ par+2
  = 2, else 1; a hint caps at 2. Levels use an increasing curve (level L starts at 50·L·(L−1)).

## 5. Decisions and why

| Decision | Why |
|---|---|
| No `evaluate`/`simplify` anywhere | They collapse terms; the whole point is that every change is a named, justified step. |
| Rules match literal forms only | Strictness is the lesson: `a·1` needs commutativity first. Diagnostics suggest the missing move. |
| Parens stripped at parse, re-derived when rendering | One source of truth for grouping (the tree), so `(ab)c` and `a(bc)` stay distinguishable. |
| Explicit brackets by default | Conventional notation hid the structure the rules act on, which made commutativity-only problems ambiguous. Toggle for long chains. |
| `recip(x)` is its own node | The book treats "1 ÷ x = 1/x" as a rule, so reciprocal and division must be distinct objects. |
| Tiered ALU (round → one-round → full), naturals only until full | Arithmetic is a *tool the player earns*; the restriction is what forces place-value and regrouping to matter. Negative literals would bypass the sign rules. |
| Macros (rearrange, everywhere) are compiled, not granted | Chunking: you earn an abstraction after doing it by hand, and can still expand it into single steps. |
| Pars verified by a simulated reference player | Prevents pars that secretly assume a tool the player can't have, and catches problems a stronger tool trivializes. |
| Proven laws are quarantined, then trusted | Where the book derives a rule (square of negation, of a quotient), the first problem proves it with the rule in `forbid`. A formula like (a+1)² becomes a `theorem` skill. Rules are earned, not handed over. |
| Square Table stops at 29² | Mirrors the book's table. Beyond it, the player must use structure (place value + Next Square, square of product/quotient) rather than brute arithmetic. |
| Power Table stops at 1,000,000 and `pow_def` at 12 copies | Big powers (88888⁴, 11²⁰⁰⁰⁰) must go through the exponent laws. The table's reverse writes a perfect power as a power of its smallest base, which is what "express as a power of 2" needs. |
| Quotient law refuses m ≤ n | The book states it for m > n; zero and negative exponents are §2.3–2.4. |
| Progress in localStorage | Single-player, no backend. It can come back empty, so all access is wrapped. |

## 6. Verification

- **Unit**: paths/immutability, pattern matching, `defineRule` (reverse/introduce/variants/nonzero),
  LaTeX brackets + path tags, registry, one positive and one negative per rule, diagnostics.
- **Campaign**: data integrity (ids resolve, no tactic in two skills), reachability of required
  skills, and the reference-player par check.
- **Deploy**: `.github/workflows/pages.yml` tests, builds (relative `base`), and publishes to GitHub Pages (https://jurisjunction.github.io/algebra-moves/) on every push to `main` or `feat/lattice-campaign`. A failed test blocks the deploy.
- **End-to-end**: a Playwright script replays the whole chapter through the real UI (keyboard
  selection, parameter prompts, compiling modules) and asserts each register is accepted.
- Screenshots are reviewed by eye; several bugs (garbled rule text, stuck panels) were only visible
  that way.

## 7. Scope and non-goals

In scope now: AoPS Ch. 1 rules and Ch. 2 §2.1–2.2 (squares, higher exponents), integers, variables, single `=` equations. Later chapters bring
exponents, fractions, decimals, roots, geometry, and stats. Not goals: a CAS, arbitrary
simplification, multi-user, or a backend. Known limits are listed in `STATUS.md`.
