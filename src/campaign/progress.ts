import type { MathNode } from "mathjs";
import { isEquation, isSym, literalValue, structKey } from "../engine/ast";
import { parseProblem } from "../engine/parse";
import { CHAPTERS, MISSIONS, SKILLS } from "./index";
import type { ChapterDef, Goal, MissionDef, ProblemDef, SkillDef } from "./types";

export interface Progress {
  version: 1;
  /** Skill ids in the instruction set. */
  owned: string[];
  /** Times each skill has been used in missions. */
  uses: Record<string, number>;
  /** Best result per problem id. */
  solved: Record<string, { stars: number; moves: number }>;
  missionsDone: string[];
  /** Missions whose briefing has been shown (skills granted). */
  missionsStarted: string[];
  chaptersSeen: number[];
  xp: number;
}

export const NEW_GAME: Progress = {
  version: 1,
  owned: [],
  uses: {},
  solved: {},
  missionsDone: [],
  missionsStarted: [],
  chaptersSeen: [],
  xp: 0,
};

// ---------- Goals & scoring ----------

export function goalReached(goal: Goal, n: MathNode): boolean {
  switch (goal.type) {
    case "match":
      return structKey(n) === structKey(parseProblem(goal.expr));
    case "value":
      return literalValue(n) !== null;
    case "solve": {
      if (!isEquation(n)) return false;
      const [l, r] = n.args;
      return (isSym(l) && literalValue(r) !== null) || (isSym(r) && literalValue(l) !== null);
    }
  }
}

export function starsFor(moves: number, par: number, usedHint: boolean): number {
  const stars = moves <= par ? 3 : moves <= par + 2 ? 2 : 1;
  return usedHint ? Math.min(stars, 2) : stars;
}

export const xpFor = (stars: number) => 10 + stars * 5;

/** Level L starts at 50·L·(L−1) XP: 0, 100, 300, 600, 1000, … */
const levelStart = (level: number) => 50 * level * (level - 1);
const TITLES: [number, string][] = [
  [1, "Salvager"],
  [2, "Technician"],
  [3, "Operator"],
  [4, "Kernel Tech"],
  [6, "Systems Adept"],
  [9, "Lattice Engineer"],
  [13, "Custodian's Peer"],
];
export function levelOf(xp: number) {
  let level = 1;
  while (levelStart(level + 1) <= xp) level++;
  const title = TITLES.filter(([l]) => l <= level).pop()![1];
  return { level, title, into: xp - levelStart(level), next: levelStart(level + 1) - levelStart(level) };
}

// ---------- Skills ----------

export interface CompileStatus {
  skill: SkillDef;
  ready: boolean;
  requirements: { label: string; have: number; need: number }[];
}

export function compileStatus(p: Progress, skill: SkillDef): CompileStatus | null {
  if (!skill.compile) return null;
  const requirements = [
    ...Object.entries(skill.compile.uses ?? {}).map(([id, need]) => ({ label: `use ${id}`, have: Math.min(p.uses[id] ?? 0, need), need })),
    ...(skill.compile.missions ?? []).map((m) => ({ label: `complete ${m} ${missionById(m)?.title ?? ""}`.trim(), have: p.missionsDone.includes(m) ? 1 : 0, need: 1 })),
  ];
  return { skill, ready: requirements.every((r) => r.have >= r.need), requirements };
}

/** Skills that could be compiled right now. */
export function compilable(p: Progress): SkillDef[] {
  return [...SKILLS.values()].filter((s) => !p.owned.includes(s.id) && compileStatus(p, s)?.ready);
}

/** Tactic ids available for a problem: owned skills minus forbidden ones, with superseded tools hidden. */
export function availableTactics(p: Progress, forbid: string[] = []): string[] {
  const active = p.owned.filter((id) => !forbid.includes(id) && SKILLS.has(id));
  const superseded = new Set(active.flatMap((id) => SKILLS.get(id)!.supersedes ?? []));
  return active.filter((id) => !superseded.has(id)).flatMap((id) => SKILLS.get(id)!.tactics);
}

// ---------- Missions ----------

export const missionById = (id: string): MissionDef | undefined => MISSIONS.find((m) => m.id === id);

const requiredMissions = (c: ChapterDef) => c.missions.filter((m) => !m.optional);

export function chapterComplete(p: Progress, c: ChapterDef): boolean {
  return requiredMissions(c).every((m) => p.missionsDone.includes(m.id));
}

export function chapterUnlocked(p: Progress, c: ChapterDef): boolean {
  const i = CHAPTERS.indexOf(c);
  return i <= 0 || chapterComplete(p, CHAPTERS[i - 1]);
}

export type MissionState = "locked" | "needs-skill" | "open" | "done";

export function missionState(p: Progress, m: MissionDef): MissionState {
  if (p.missionsDone.includes(m.id)) return "done";
  const chapter = CHAPTERS.find((c) => c.missions.includes(m))!;
  if (!chapterUnlocked(p, chapter)) return "locked";
  // Required missions unlock in order; optional ones open once everything before them is done.
  const before = chapter.missions.slice(0, chapter.missions.indexOf(m)).filter((x) => !x.optional);
  if (!before.every((x) => p.missionsDone.includes(x.id))) return "locked";
  if ((m.requires ?? []).some((s) => !p.owned.includes(s))) return "needs-skill";
  return "open";
}

export const missionProblemsDone = (p: Progress, m: MissionDef) => m.problems.filter((x) => p.solved[x.id]).length;

/** The next thing to do: first open mission that isn't done. */
export function nextMission(p: Progress): MissionDef | undefined {
  return MISSIONS.find((m) => !m.optional && missionState(p, m) !== "done") ?? MISSIONS.find((m) => missionState(p, m) === "open");
}

// ---------- State transitions (pure) ----------

export function startMission(p: Progress, m: MissionDef): Progress {
  if (p.missionsStarted.includes(m.id)) return p;
  const owned = [...p.owned, ...(m.grants ?? []).filter((s) => !p.owned.includes(s))];
  return { ...p, owned, missionsStarted: [...p.missionsStarted, m.id] };
}

export function recordMoves(p: Progress, skillIds: string[]): Progress {
  const uses = { ...p.uses };
  skillIds.forEach((s) => (uses[s] = (uses[s] ?? 0) + 1));
  return { ...p, uses };
}

/** Record a solved problem; XP is only awarded for improvements. */
export function recordSolve(p: Progress, problem: ProblemDef, mission: MissionDef, moves: number, usedHint: boolean) {
  const stars = starsFor(moves, problem.par, usedHint);
  const prev = p.solved[problem.id];
  const gained = Math.max(0, xpFor(stars) - (prev ? xpFor(prev.stars) : 0));
  const solved = {
    ...p.solved,
    [problem.id]: prev ? { stars: Math.max(prev.stars, stars), moves: Math.min(prev.moves, moves) } : { stars, moves },
  };
  let next: Progress = { ...p, solved, xp: p.xp + gained };
  const missionFinished = !p.missionsDone.includes(mission.id) && mission.problems.every((x) => solved[x.id]);
  if (missionFinished) next = { ...next, missionsDone: [...next.missionsDone, mission.id], xp: next.xp + (mission.boss ? 100 : 25) };
  return { progress: next, stars, gained, missionFinished };
}

export function compileSkill(p: Progress, skill: SkillDef): Progress {
  if (p.owned.includes(skill.id) || !compileStatus(p, skill)?.ready) return p;
  return { ...p, owned: [...p.owned, skill.id], xp: p.xp + 20 };
}

// ---------- Persistence ----------

const KEY = "algebra-moves:campaign:v1";

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return NEW_GAME;
    const data = JSON.parse(raw) as Progress;
    return data.version === 1 ? { ...NEW_GAME, ...data } : NEW_GAME;
  } catch {
    return NEW_GAME;
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage unavailable (private mode, blocked): progress lasts for this session only
  }
}
