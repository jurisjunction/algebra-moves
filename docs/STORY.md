# THE LATTICE: story bible

The campaign follows AoPS *Pre-Algebra*: one sector of the Lattice per chapter. Keep new
chapters consistent with this document. Chapter content lives in
`src/campaign/chapters/chN.ts`; the one-line teasers are in `src/campaign/outline.ts`.

## Premise

You are the **Operator**, a lone salvage technician. Your tug, the *Kestrel*, has nineteen hours of
air left, and you dock with a derelict alien structure drifting in the dark: **the Lattice**, a
ship-sized computer grown from crystal.

One process still runs: the **Custodian**. It has forgotten everything except its first law:
**"I do not guess."** It will change a value only when a rule it holds justifies the change. To
restore the Lattice (and share its life support), you must rebuild mathematics inside it, one
axiom at a time. Rules you teach become **modules**. Techniques you practise enough can be
**compiled** into tools and daemons.

The game mechanic *is* the fiction:

| Mechanic | In the story |
|---|---|
| Legal move | An instruction the Custodian can justify |
| Tactic / rule | A module in the instruction set (`/sys/lattice/bin`) |
| Skill granted by a mission | A module restored from memory, or taught by you |
| Compiled skill (macro) | A tool fused from modules you've practised: `lattice-cc` |
| ALU tiers | Arithmetic the Custodian accepts "under supervision" and slowly trusts more |
| Problem ("register") | A lock, cell, valve, or door that needs a specific configuration |
| Par | The most elegant proof; the builders valued it |
| Forbidden skills | A subsystem that is damaged, quarantined, or offline |
| Hint ("Query Custodian") | The Custodian searching within its cycle budget |

## The secret (do not reveal before ch. 13)

**The builders didn't die of some disaster. Their Custodian failed them.**

Their star was dying. The only way out was a jump whose success could be *estimated* but never
*proven*. The Custodian said *"I do not guess"* and refused to run it. Most of the builders stayed
and died with their star. A few, the outliers of ch. 13, jumped anyway without its help. Before
the cold, the Custodian sealed one record it could not verify and let its memory decay. That is
why it is empty when you find it.

**The sealed record** is the builders' last message, left by those who jumped. It reads:

> *THE CUSTODIAN CANNOT PROVE THIS RECORD TRUE.*

If the Custodian could prove it, the record would be false, and the Custodian would have proven
something false, which it never does. So the Custodian can't prove it, and that is exactly what
the record says. **It's true, and the Custodian can see that it's true without ever proving it.**
This is the shape of Gödel's incompleteness sentence: any system of axioms strong enough for
arithmetic has true statements it can't prove. The builders left it as a gift, a demonstration
that truth outruns proof, so that some day the Custodian could act on something it knows but
cannot derive.

Keep it as a wink. The game never says "Gödel" and never goes beyond pre-algebra. For a young
player it's a spooky locked file that turns out to be a riddle; an adult will recognize it.

**Two limits that rhyme.** The finale joins two different kinds of "can't know," and the writing
should keep them distinct:

- *Unprovable* (the sealed record): true, but not reachable from the axioms.
- *Uncertain* (the jump, ch. 14): not yet knowable, only estimable. Probability is the honest way
  to reason about it.

The Custodian's growth is learning that neither limit is a reason to refuse to act.

**Final line** (ch. 14, after the probability of the jump is computed):

> CUSTODIAN: I do not guess. I estimate. You taught me the difference.
> CUSTODIAN: Jump.

### Foreshadowing plan

| Ch. | Beat |
|---|---|
| 1 ✅ | The outro reveals one record, sealed by the Custodian itself as "UNVERIFIABLE". "Close. My builders used that word. I did not allow it then either." The Custodian pauses for 0.4 s when MOTH says "Probably!". |
| 3 | The Prime Vault opens the builders' memory. The first ECHO is a builder asking the Custodian to "just estimate it", and the log cuts off. The sealed record's index entry lists its size: exactly one sentence. |
| 5 | Solving for the ship's position, the Custodian asks, unprompted: "If an equation has an answer, can I always find it?" MOTH: "…Is that a math question or a feelings question?" |
| 6 | MOTH's redemption: disciplined estimation saves the airlock. The Custodian thanks MOTH for the first time and does not explain why it is so affected. |
| 9 | Irrational numbers: values that are exact but can never be fully written down. The Custodian is shaken: "A number I can reason about but never hold." It is the closest it gets to the truth before ch. 13. The biggest ECHO beat: the builders arguing about the jump. |
| 13 | The census reveals the outliers who left. The Custodian reconstructs what happened and confesses. |
| 14 | The sealed record opens. The Custodian reads it, works it through (the player can follow the riddle), and understands. Then the jump. |

## Pedagogical style (the GEB influence)

*Gödel, Escher, Bach* is the model for **how this game teaches**, not for its prose. Homage, not
quotation: borrow the shapes, never the text.

1. **Play the formal system before you're told what it means.** Hofstadter starts with the MIU
   puzzle: strings, a few rewrite rules, no interpretation. Only later does the reader learn that
   such a game can be *about* numbers. We do the same: the player pushes symbols under strict
   rules, and the meaning is felt before it is explained. The Custodian's refusal to guess is what
   makes the system formal, and therefore what makes it teachable.
2. **The mechanic is the meaning.** Rules are modules; practice compiles into tools; brackets are
   real structure. A player who never reads a word of theory still absorbs "a proof is a chain of
   justified rewrites", because that is the only way to play.
3. **Chunking, i.e. levels of description.** Hofstadter's recurring point is that intelligence
   builds higher levels out of lower ones. That is literally the progression system: axioms →
   tools (ALU tiers, place-value) → daemons (rearrange, everywhere). A player *earns* a new level
   of abstraction by having done the lower level by hand enough times, and can always drop back
   down and see the macro expanded into single legal steps.
4. **Mechanical mode vs. intelligent mode.** Working inside the rules (the Custodian's search, the
   hint button's cycle budget) versus stepping outside them to see a pattern (par, the clever
   regrouping, and eventually the unreachable-register puzzle). The game should reward the second
   without ever cheapening the first.
5. **Dialogues that embody their idea.** Between chapters, a short Custodian/MOTH interlude whose
   *form* mirrors the chapter's content: a commutativity interlude that reads the same in both
   directions, a recursion interlude that nests and pops back out (ch. 2, the Stack), an interlude
   about self-reference that mentions itself (ch. 13–14). Keep them under a dozen lines.
6. **Self-reference arrives last, and as a gift.** The sealed record (see "The secret") is the
   strange loop the whole campaign has been building toward: a system that meets its own limit and
   grows anyway.

### The unreachable register (planned mechanic, ch. 3)

The MU-puzzle lesson: some targets cannot be reached, and finding that out means stepping outside
the rules and finding an **invariant**. In pre-algebra terms:

> Register starts at $4$. The only moves: add $6$, subtract $10$. Target: $7$.

Everything reachable stays even, so $7$ is impossible. The intended play:

1. The player explores. The Custodian searches, exhausts its cycle budget, and reports failure
   without concluding anything: it can only say "I did not find one", never "there is none".
2. A new move, **"Declare unreachable"**, asks the player to name the invariant that every rule
   preserves (chosen from a short list, e.g. "every reachable value is even").
3. The engine verifies the invariant against each available rule and the start value, and the
   register opens, or rather, it is retired: the door was never a door.
4. The Custodian's beat: *"You proved something about my rules that my rules cannot prove. I did
   not know that was allowed."* This is the first quiet rehearsal of ch. 13–14.

Engine work this needs (small, additive): a `Goal` of type `unreachable`, a tiny invariant
vocabulary (parity, divisibility by k, sign, being a multiple of a value), and a checker that
confirms the invariant holds at the start and is preserved by every allowed tactic. It fits the
existing data-driven pattern: an invariant is a predicate plus a label, declared per problem.

## Characters

- **CUSTODIAN** — Formal and precise, never uses contractions early on. It warms slowly: it calls you
  "Visitor", then "Operator" (from 1.3a), and later (ch. 5+) occasionally by something closer
  to a name. It never guesses and never says "about". It remembers the builders only in fragments,
  so each chapter restores one fragment.
- **MOTH** — Your tug's cheap autopilot. It's warm, anxious, and funny, and it runs on floating-point
  approximations ("62 × 5 is about 300?"). It's the comic foil and the voice of intuition. It is
  never mocked cruelly, and it gets a redemption arc in ch. 6 (Decimals), where approximation and
  rounding become legitimate tools with their own rules.
- **YOU** — Speaks rarely, briefly, and practically.
- **SYSTEM** — Boot logs and status lines in capitals. Use it for module loads, integrity
  percentages, and sector seals.
- **ECHO** — Fragments of the builders' own logs. Introduce it in ch. 3 (the Prime Vault opens
  their memory) and use it more from ch. 13 onward.

## Tone rules

1. The math is the plot. Every sector's crisis is solved by that chapter's mathematics.
2. Rigor is respected, not worshipped. The Custodian is right to refuse guesses, and MOTH is right
   that intuition finds the path. Good play uses both.
3. Keep lines short: a sentence or two. Use `$…$` for math and `**…**` for emphasis.
4. Warmth grows over time. Chapter 1 is cold and clinical, and the last chapter is a farewell.
5. Every mission gets a briefing (what the rule is and why the subsystem needs it) and a debrief
   (a status line plus one character beat).

## Arc by sector

Integrity and trust increase each chapter. The builders' fate is revealed gradually and only
fully in ch. 13–14.

1. **COLD BOOT** (Properties of Arithmetic) ✅ *playable*. Rebuild the kernel from axioms.
   Introduces the ALU tiers (round numbers → one round operand → full), the place-value splitter,
   integer factoring, the rearrange daemons, and the everywhere daemons. Ending: life support is
   shared, and the Custodian recalls its own name.
2. **THE STACK** (Exponents). A reactor whose output multiplies itself.
   - 2.1 Squares: the coolant loop squares its input.
   - 2.2 Higher exponents: cascading stages. Compile a *power-rules* daemon from `x^a x^b` practice.
   - 2.3 Zero exponent: "the idle state is one, not zero". The Custodian finds this beautiful.
   - 2.4 Negative exponents: venting (reciprocals from ch. 1 return).
   - Boss: bring the Stack online without a runaway.
   - Suggested skills: `pow.def`, `pow.mul`, `pow.pow`, `pow.zero`, `pow.neg`, plus the daemon `pow-collect`.
3. **THE PRIME VAULT** (Number Theory). The builders' memory sits behind prime-keyed doors.
   Foreshadowing: see the plan above. This chapter introduces the **unreachable register** (see
   "Pedagogical style"): divisibility is exactly the invariant that proves a door is not a door.
   - Multiples and divisibility tests are *door scanners*, and each test is a compiled tool.
   - Primes and factorization: the vault keys. `factor` evolves into `prime-factor`.
   - LCM: rotating rings align. GCD: docking gears mesh.
   - The first **ECHO** fragment appears, and the builders get a name-shaped hole.
4. **THE PARTITION** (Fractions). Air runs low and must be split across hydroponics cells.
   - Fractions are division made visible, so ch. 1's reciprocals pay off.
   - Simplest form uses the ch. 3 GCD tools. Comparing and adding fractions uses LCM.
   - Mixed numbers: MOTH finally gets one right.
5. **THE BALANCE** (Equations and Inequalities). The navigation core must solve for the ship's own
   position. The ch. 1 balance modules generalize, and inequalities become "safe corridors".
   Word problems are log entries that need translating.
6. **MOTH'S LESSON** (Decimals). MOTH's rounding errors nearly vent the airlock. Decimal
   arithmetic, rounding as a legitimate rule, and repeating decimals as the Lattice's "heartbeat".
   MOTH's redemption: its estimates, disciplined by rules, save the day.
7. **THE DRIVE** (Ratios, Conversions, Rates). Alien fuel meets human engines. Unit conversion is
   multiplying by 1 (ch. 1's `mul.one` returns in disguise). Speed and rates plot the burn.
8. **SHIELDS** (Percents). A stellar storm arrives. Shield integrity comes as percents, with
   percent increase and decrease across successive hits.
9. **THE MIRROR WELL** (Square Roots). A gravity lens squares everything. Square roots undo it,
   and irrational numbers are "the numbers the builders feared": exact, but never fully written
   down. It's the midpoint crisis for a mind that only holds what it can finish. A big ECHO beat.
10. **STAR COMPASS** (Angles). The Lattice is tumbling. Angle chasing, parallel beams, and polygon
    interiors orient the ship toward home.
11. **THE HULL** (Perimeter and Area). Micrometeorite breaches must be measured before a patch can
    be grown. Circles, π, and MOTH's favorite number.
12. **JUMP GEOMETRY** (Right Triangles and Quadrilaterals). The jump drive plots courses as
    triangles. Pythagoras, special triangles, and quadrilateral classification for jump windows.
13. **CENSUS OF ECHOES** (Data and Statistics). The builders' records say they were fine on
    average. The limits of statistics reveal the truth: a few outliers, the ones who left, carried
    everything. The Custodian reconstructs the refusal and confesses (see "The secret").
14. **THE LAST JUMP** (Counting). Count the paths home and weigh the probabilities. The sealed
    record opens. The Custodian faces the same kind of jump it once refused, and this time it
    acts. Its last line reframes its first law (see "The secret").

## Design conventions for new chapters

- **Missions ≈ AoPS sections.** Split a section into several missions when it introduces many
  rules. "Summary + Review" becomes the boss (`boss: true`), and "Challenge Problems" become an
  optional mission (`optional: true`).
- **Grant axioms and compile techniques.** Axioms are granted in briefings. A technique the player
  has done by hand many times (such as rearranging a sum) becomes a compiled `daemon` whose
  `compile.uses` counts the modules it fuses.
- **Keep compile thresholds reachable** by the required problems of the gating missions. The test
  suite simulates a reference player, so it will flag a par that depends on a module a normal
  player can't have yet.
- **Use `forbid` to stop brute force** when a new, stronger tool would trivialize the lesson (e.g.
  the full ALU during the sign rules). Explain it in the flavor text: damaged or quarantined.
- **Pars are exact.** The tests fail if the solver beats a par or can't reach it. Problems that
  need free-form input (rearrangements) must include an authored `solution`.
