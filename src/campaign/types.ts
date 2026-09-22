/**
 * Campaign data model. Everything here is plain data: a chapter file in
 * `src/campaign/chapters/` exports a `ChapterDef` and is picked up automatically.
 */

export type Speaker = "SYSTEM" | "CUSTODIAN" | "MOTH" | "YOU" | "ECHO";

/** One line of dialogue. `text` may contain `$inline math$` and `**bold**`. */
export interface Line {
  who: Speaker;
  text: string;
}

/** A theorem is a statement the player proved by hand; it compiles into a rule like any other. */
export type SkillKind = "axiom" | "tool" | "daemon" | "theorem";

/**
 * A skill is a module in the Custodian's instruction set. Owning it makes its tactics
 * available. Skills are either granted by a mission or compiled by the player once the
 * requirements are met.
 */
export interface SkillDef {
  /** Codename shown in the UI, e.g. `add.comm`. */
  id: string;
  title: string;
  kind: SkillKind;
  /** Tactic ids (from `src/tactics/`) this skill unlocks. */
  tactics: string[];
  /** Flavor text. */
  lore: string;
  /** Hide these skills' tactics once this one is owned (e.g. a better ALU). */
  supersedes?: string[];
  /** If present, the skill is compiled by the player rather than granted. */
  compile?: {
    /** Minimum number of times each skill must have been used in missions. */
    uses?: Record<string, number>;
    /** Missions that must be complete. */
    missions?: string[];
  };
}

export type Goal =
  /** Reach exactly this expression. */
  | { type: "match"; expr: string }
  /** Reduce to a single number. */
  | { type: "value" }
  /** Reach `variable = number`. */
  | { type: "solve" };

export interface ProblemMove {
  path: number[];
  tactic: string;
  params?: Record<string, string>;
}

export interface ProblemDef {
  id: string;
  start: string;
  goal: Goal;
  /** Fewest moves known. Solving within par earns 3 stars. */
  par: number;
  /** Narrative framing shown above the problem. */
  flavor?: string;
  hint?: string;
  /** Skills that are offline for this problem (their tactics are unavailable). */
  forbid?: string[];
  /**
   * A known solution. Required when the solver cannot find one on its own
   * (e.g. it needs a free-form rearrangement); tests replay it.
   */
  solution?: ProblemMove[];
}

export interface MissionDef {
  id: string;
  /** AoPS section this mission covers, e.g. "1.2 Addition". */
  section: string;
  title: string;
  briefing: Line[];
  debrief: Line[];
  /** Skills loaded when the mission starts. */
  grants?: string[];
  /** Skills that must be owned (e.g. compiled) before the mission opens. */
  requires?: string[];
  problems: ProblemDef[];
  /** Optional missions (challenge problems) don't gate progress. */
  optional?: boolean;
  boss?: boolean;
}

export interface ChapterDef {
  number: number;
  /** In-story sector name. */
  codename: string;
  /** AoPS chapter title. */
  aopsTitle: string;
  intro: Line[];
  outro: Line[];
  skills: SkillDef[];
  missions: MissionDef[];
}

/** Planned chapter that has no playable data yet. */
export interface ChapterOutline {
  number: number;
  codename: string;
  aopsTitle: string;
  teaser: string;
}
