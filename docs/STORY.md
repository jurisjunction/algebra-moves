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
   and irrational numbers are "the numbers the builders feared". A big ECHO beat.
10. **STAR COMPASS** (Angles). The Lattice is tumbling. Angle chasing, parallel beams, and polygon
    interiors orient the ship toward home.
11. **THE HULL** (Perimeter and Area). Micrometeorite breaches must be measured before a patch can
    be grown. Circles, π, and MOTH's favorite number.
12. **JUMP GEOMETRY** (Right Triangles and Quadrilaterals). The jump drive plots courses as
    triangles. Pythagoras, special triangles, and quadrilateral classification for jump windows.
13. **CENSUS OF ECHOES** (Data and Statistics). The builders' records say they were fine on
    average. The limits of statistics reveal the truth: a few outliers, the ones who left, carried
    everything.
14. **THE LAST JUMP** (Counting). Count the paths home and weigh the probabilities. The final
    choice is whether the Custodian comes with you. Its last line should echo its first law, with
    a new meaning.

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
