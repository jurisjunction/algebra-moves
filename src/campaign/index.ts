import type { ChapterDef, MissionDef, ProblemDef, SkillDef } from "./types";
import { OUTLINE } from "./outline";

/**
 * Auto-loads every `chapters/*.ts` whose default export is a ChapterDef.
 * Adding `ch2.ts` makes Chapter 2 playable; nothing else needs to change.
 */
const modules = import.meta.glob<{ default?: ChapterDef }>("./chapters/*.ts", { eager: true });

export const CHAPTERS: ChapterDef[] = Object.values(modules)
  .map((m) => m.default)
  .filter((c): c is ChapterDef => !!c && Array.isArray(c.missions))
  .sort((a, b) => a.number - b.number);

export { OUTLINE };

export const SKILLS: Map<string, SkillDef> = new Map(CHAPTERS.flatMap((c) => c.skills).map((s) => [s.id, s]));

/** Missions in play order across all chapters. */
export const MISSIONS: MissionDef[] = CHAPTERS.flatMap((c) => c.missions);

export const MISSION_CHAPTER = new Map(CHAPTERS.flatMap((c) => c.missions.map((m) => [m.id, c] as const)));

export const PROBLEMS = new Map<string, { problem: ProblemDef; mission: MissionDef }>(
  MISSIONS.flatMap((m) => m.problems.map((p) => [p.id, { problem: p, mission: m }] as const)),
);

/** tactic id → skill id, for counting skill usage. */
export const TACTIC_SKILL = new Map<string, string>(
  [...SKILLS.values()].flatMap((s) => s.tactics.map((t) => [t, s.id] as const)),
);
