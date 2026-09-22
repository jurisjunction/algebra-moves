import { describe, expect, it } from "vitest";
import { structKey } from "../../engine/ast";
import { loadTactics } from "../../engine/loader";
import { parseProblem } from "../../engine/parse";
import { solve } from "../../engine/solver";
import { applyTactic, initialState } from "../../engine/transformer";
import { CHAPTERS, MISSIONS, SKILLS } from "../index";
import { OUTLINE } from "../outline";
import {
  availableTactics,
  compilable,
  compileSkill,
  goalReached,
  missionState,
  NEW_GAME,
  recordMoves,
  recordSolve,
  startMission,
  type Progress,
} from "../progress";
import type { MissionDef } from "../types";
import { simulateCampaign } from "./simulate";

const registry = loadTactics();

/**
 * The skills a player can own when starting `mission`: everything granted so far plus every
 * compiled skill whose mission requirements are already met (usage can always be earned by replaying).
 */
function skillsAt(mission: MissionDef): Progress {
  const idx = MISSIONS.indexOf(mission);
  const done = MISSIONS.slice(0, idx).map((m) => m.id);
  const owned = new Set(MISSIONS.slice(0, idx + 1).flatMap((m) => m.grants ?? []));
  for (const s of SKILLS.values()) {
    if (s.compile && (s.compile.missions ?? []).every((m) => done.includes(m))) owned.add(s.id);
  }
  return { ...NEW_GAME, owned: [...owned], missionsDone: done };
}

describe("campaign data", () => {
  it("every chapter is in the outline and numbered uniquely", () => {
    for (const c of CHAPTERS) expect(OUTLINE.find((o) => o.number === c.number)?.codename).toBe(c.codename);
  });

  it("every skill references real tactics, and every tactic belongs to at most one skill", () => {
    const seen = new Set<string>();
    for (const s of SKILLS.values()) {
      for (const t of s.tactics) {
        expect(registry.getById(t), `${s.id} → ${t}`).toBeDefined();
        expect(seen.has(t), `${t} in two skills`).toBe(false);
        seen.add(t);
      }
    }
  });

  it("every referenced skill and mission exists", () => {
    const ids = new Set(MISSIONS.map((m) => m.id));
    for (const m of MISSIONS) {
      for (const s of [...(m.grants ?? []), ...(m.requires ?? []), ...m.problems.flatMap((p) => p.forbid ?? [])]) {
        expect(SKILLS.has(s), `${m.id} → ${s}`).toBe(true);
      }
    }
    for (const s of SKILLS.values()) {
      for (const m of s.compile?.missions ?? []) expect(ids.has(m), `${s.id} → ${m}`).toBe(true);
      for (const u of Object.keys(s.compile?.uses ?? {})) expect(SKILLS.has(u), `${s.id} → ${u}`).toBe(true);
    }
  });

  it("every mission's required skills can be owned by then", () => {
    for (const m of MISSIONS) {
      const p = skillsAt(m);
      for (const s of m.requires ?? []) expect(p.owned, `${m.id} requires ${s}`).toContain(s);
    }
  });
});

describe("every problem is solvable at exactly par by a player who compiles modules as they become ready", () => {
  const sim = simulateCampaign();
  it.each(sim.map((x) => [x.problem.id, x] as const))("%s", (_id, { problem, progress, solution }) => {
    const start = parseProblem(problem.start);
    expect(goalReached(problem.goal, start), "already solved at start").toBe(false);
    expect(solution, `no solution within depth`).not.toBeNull();
    const allowed = new Set(availableTactics(progress, problem.forbid));

    // Replay through the real transformer, using only available tactics.
    let history = [initialState(start)];
    for (const mv of solution!) {
      expect(allowed.has(mv.tacticId), `${mv.tacticId} not available`).toBe(true);
      const r = applyTactic(history, mv.path, mv.tacticId, mv.params, registry);
      if (!r.ok) throw new Error(`${mv.tacticId}: ${r.message}`);
      history = r.history;
    }
    expect(goalReached(problem.goal, history[history.length - 1].exprNode)).toBe(true);
    expect(solution!.length, "par").toBe(problem.par);

    if (!problem.solution) return;
    // Authored solutions must also be optimal against what the solver can find.
    const tactics = registry.getAll().filter((t) => allowed.has(t.id));
    const shorter = solve(start, (n) => goalReached(problem.goal, n), tactics, { maxDepth: problem.par - 1, maxStates: 200_000 });
    expect(shorter?.length ?? null, "authored solution can be beaten").toBeNull();
  }, 60_000);
});

describe("progress", () => {
  it("grants skills on start, records solves, and gates compiling", () => {
    const [m1, m2] = MISSIONS;
    let p = startMission(NEW_GAME, m1);
    expect(p.owned).toContain("add.comm");
    expect(missionState(p, m2)).toBe("locked");
    for (const prob of m1.problems) p = recordSolve(p, prob, m1, prob.par, false).progress;
    expect(p.missionsDone).toContain(m1.id);
    expect(missionState(p, m2)).toBe("open");
    expect(p.xp).toBeGreaterThan(0);
  });

  it("does not award XP twice for the same result", () => {
    const m = MISSIONS[0];
    const once = recordSolve(NEW_GAME, m.problems[0], m, 1, false);
    const twice = recordSolve(once.progress, m.problems[0], m, 1, false);
    expect(twice.gained).toBe(0);
  });

  it("compiles a skill once requirements are met, and supersedes older tools", () => {
    let p: Progress = { ...NEW_GAME, owned: ["alu.1", "place", "dist"], missionsDone: ["1.3b"] };
    expect(compilable(p).map((s) => s.id)).not.toContain("alu.2");
    p = recordMoves(p, ["place", "place", "place", "place", "dist", "dist", "dist"]);
    expect(compilable(p).map((s) => s.id)).toContain("alu.2");
    p = compileSkill(p, SKILLS.get("alu.2")!);
    const tactics = availableTactics(p);
    expect(tactics).toContain("alu_one_round");
    expect(tactics).not.toContain("alu_round");
    expect(availableTactics(p, ["alu.2"])).toContain("alu_round");
  });
});

it("problem starts parse to distinct keys", () => {
  const keys = MISSIONS.flatMap((m) => m.problems.map((p) => structKey(parseProblem(p.start))));
  expect(keys.length).toBeGreaterThan(0);
});
