import { loadTactics } from "../../engine/loader";
import { parseProblem } from "../../engine/parse";
import { solve, type Move } from "../../engine/solver";
import { MISSIONS, TACTIC_SKILL } from "../index";
import { availableTactics, compilable, compileSkill, goalReached, NEW_GAME, recordMoves, startMission, type Progress } from "../progress";
import type { MissionDef, ProblemDef } from "../types";

export interface SimulatedProblem {
  mission: MissionDef;
  problem: ProblemDef;
  /** Skills owned when the problem was attempted. */
  progress: Progress;
  /** Shortest solution with those skills (or the authored one), null if none found. */
  solution: Move[] | null;
}

/**
 * Plays the campaign in order as a "reference player": starts each mission, compiles every
 * module that is ready, and solves each problem with a shortest solution, accumulating real
 * skill usage. Pars and softlock checks are measured against this player.
 */
export function simulateCampaign(maxDepth = 9): SimulatedProblem[] {
  const registry = loadTactics();
  let p: Progress = NEW_GAME;
  const out: SimulatedProblem[] = [];
  for (const mission of MISSIONS) {
    for (const s of compilable(p)) p = compileSkill(p, s);
    p = startMission(p, mission);
    for (const problem of mission.problems) {
      const allowed = new Set(availableTactics(p, problem.forbid));
      const tactics = registry.getAll().filter((t) => allowed.has(t.id));
      const solution = problem.solution
        ? problem.solution.map((s) => ({ path: s.path, tacticId: s.tactic, params: s.params }))
        : solve(parseProblem(problem.start), (n) => goalReached(problem.goal, n), tactics, { maxDepth, maxStates: 300_000 });
      out.push({ mission, problem, progress: p, solution });
      if (solution) p = recordMoves(p, solution.map((m) => TACTIC_SKILL.get(m.tacticId)!).filter(Boolean));
    }
    p = { ...p, missionsDone: [...p.missionsDone, mission.id] };
  }
  return out;
}
