import { ArrowLeft, BookOpen, BrainCircuit, ChevronRight, RotateCcw, Star, Target, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MathText, Tex } from "../../components/Tex";
import { Workspace, type WorkspaceHint } from "../../components/Workspace";
import { useTex } from "../../components/display";
import { parseProblem } from "../../engine/parse";
import { registry } from "../../engine/registry";
import { back, explore, lineTo, moveTo, type Exploration } from "../../engine/exploration";
import { solve } from "../../engine/solver";
import { initialState } from "../../engine/transformer";
import type { TacticPlugin } from "../../types/tactic";
import { TACTIC_SKILL } from "../index";
import { availableTactics, goalReached, recordMoves, recordSolve, type Progress } from "../progress";
import type { Goal, MissionDef, ProblemDef } from "../types";

interface Props {
  mission: MissionDef;
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onExit: () => void;
  onBriefing: () => void;
  onMissionComplete: () => void;
}

interface Result {
  stars: number;
  gained: number;
  moves: number;
  missionFinished: boolean;
}

function GoalView({ goal }: { goal: Goal }) {
  const tex = useTex();
  if (goal.type === "match") return <Tex latex={tex(parseProblem(goal.expr))} />;
  if (goal.type === "value") return <span className="font-mono text-sm text-slate-300">reduce to a single number</span>;
  return <span className="font-mono text-sm text-slate-300">solve: unknown = number</span>;
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star key={i} size={size} className={i <= n ? "fill-amber-300 text-amber-300" : "text-slate-700"} />
      ))}
    </span>
  );
}

export function MissionView({ mission, progress, setProgress, onExit, onBriefing, onMissionComplete }: Props) {
  const firstOpen = Math.max(0, mission.problems.findIndex((p) => !progress.solved[p.id]));
  const [index, setIndex] = useState(firstOpen);
  const problem: ProblemDef = mission.problems[index];

  const fresh = (p: ProblemDef) => explore(initialState(parseProblem(p.start)));
  const [exploration, setExploration] = useState<Exploration>(() => fresh(problem));
  const [usedHint, setUsedHint] = useState(false);
  const [hint, setHint] = useState<WorkspaceHint | null>(null);
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const allowedIds = availableTactics(progress, problem.forbid);
  const allowedKey = allowedIds.join(",");
  const tactics = useMemo(() => {
    const allowed = new Set(allowedKey.split(","));
    return registry.getAll().filter((t) => allowed.has(t.id));
  }, [allowedKey]);

  const clearTurn = () => {
    setUsedHint(false);
    setHint(null);
    setHintMsg(null);
    setResult(null);
  };

  // Back to the start, keeping every line explored so far.
  const reset = () => {
    setExploration((ex) => moveTo(ex, 0));
    clearTurn();
  };

  const goTo = (i: number) => {
    setIndex(i);
    setExploration(fresh(mission.problems[i]));
    clearTurn();
  };

  const history = lineTo(exploration);
  const current = history[history.length - 1].exprNode;
  const solved = goalReached(problem.goal, current);
  const moves = history.length - 1;

  const onExplorationChange = (ex: Exploration, applied?: TacticPlugin) => {
    setExploration(ex);
    setHint(null);
    setHintMsg(null);
    const skill = applied && TACTIC_SKILL.get(applied.id);
    let next = skill ? recordMoves(progress, [skill]) : progress;
    // Jumping onto a line that already reached the goal counts too; recordSolve keeps the best.
    const line = lineTo(ex);
    if (goalReached(problem.goal, line[line.length - 1].exprNode)) {
      const r = recordSolve(next, problem, mission, line.length - 1, usedHint);
      next = r.progress;
      setResult({ stars: r.stars, gained: r.gained, moves: line.length - 1, missionFinished: r.missionFinished });
    }
    if (next !== progress) setProgress(() => next);
  };

  const askCustodian = () => {
    const found = solve(current, (n) => goalReached(problem.goal, n), tactics, { maxDepth: Math.max(problem.par + 2, 6), maxStates: 20_000 });
    setUsedHint(true);
    if (!found || !found.length) {
      setHint(null);
      setHintMsg(
        problem.hint
          ? `I cannot see a path from here within my cycle budget. The builders' note reads: ${problem.hint}`
          : "I cannot see a path from here within my cycle budget. Consider undoing a step.",
      );
      return;
    }
    const first = found[0];
    const t = registry.getById(first.tacticId)!;
    setHint({ path: first.path, tacticId: first.tacticId });
    setHintMsg(`I would apply **${t.name}** to the highlighted part. ${found.length} move${found.length === 1 ? "" : "s"} from the goal.`);
  };

  const nextUnsolved = mission.problems.findIndex((p, i) => i > index && !progress.solved[p.id]);
  const nextIndex = nextUnsolved >= 0 ? nextUnsolved : mission.problems.findIndex((p) => !progress.solved[p.id]);

  return (
    <div className="space-y-4">
      {/* Mission header */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onExit} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <ArrowLeft size={14} /> Map
        </button>
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.3em] text-cyan-400/70 uppercase">
            Mission {mission.id} · {mission.section}
          </p>
          <h2 className="font-mono text-xl font-semibold tracking-widest text-slate-100">{mission.title}</h2>
        </div>
        <button onClick={onBriefing} className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300 hover:bg-slate-800">
          <BookOpen size={12} /> Briefing
        </button>
      </div>

      {/* Problem tabs */}
      <div className="flex flex-wrap gap-1.5">
        {mission.problems.map((p, i) => {
          const s = progress.solved[p.id];
          return (
            <button
              key={p.id}
              onClick={() => goTo(i)}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition ${
                i === index ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100" : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600"
              }`}
            >
              R{String(i + 1).padStart(2, "0")}
              {s ? <Stars n={s.stars} size={10} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
            </button>
          );
        })}
      </div>

      {/* Problem card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        {problem.flavor && (
          <p className="mb-3 text-sm leading-relaxed text-slate-300">
            <MathText text={problem.flavor} />
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <Target size={14} className="text-cyan-400" />
            <span className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Target</span>
            <span className="text-lg text-cyan-100">
              <GoalView goal={problem.goal} />
            </span>
          </span>
          <span className="font-mono text-xs text-slate-400">
            moves <span className={moves > problem.par ? "text-amber-300" : "text-slate-100"}>{moves}</span> · par {problem.par}
          </span>
          {progress.solved[problem.id] && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
              best {progress.solved[problem.id].moves} <Stars n={progress.solved[problem.id].stars} size={11} />
            </span>
          )}
          {problem.forbid && problem.forbid.some((f) => progress.owned.includes(f)) && (
            <span className="rounded bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] text-rose-300">
              offline: {problem.forbid.filter((f) => progress.owned.includes(f)).join(" · ")}
            </span>
          )}
          <span className="ml-auto flex gap-1.5">
            <button
              onClick={() => !result && setExploration(back)}
              disabled={moves === 0 || !!result}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <Undo2 size={12} /> Undo
            </button>
            <button
              onClick={() => reset()}
              disabled={moves === 0}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={askCustodian}
              disabled={solved}
              title="The Custodian searches for a path. Using a hint caps this problem at 2 stars."
              className="inline-flex items-center gap-1 rounded-md border border-violet-400/40 px-2.5 py-1 font-mono text-xs text-violet-200 hover:bg-violet-500/10 disabled:opacity-40"
            >
              <BrainCircuit size={12} /> Query Custodian
            </button>
          </span>
        </div>
        {hintMsg && (
          <div className="rise mt-3 flex gap-3 rounded-md border border-violet-400/30 bg-violet-950/30 px-3 py-2 text-sm text-violet-100">
            <span className="pt-0.5 font-mono text-[11px] font-semibold tracking-widest text-violet-300">CUSTODIAN</span>
            <p>
              <MathText text={hintMsg} />
            </p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="rise flex flex-wrap items-center gap-4 rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-5 py-4">
          <Stars n={result.stars} size={22} />
          <div>
            <p className="font-mono text-sm font-semibold tracking-widest text-emerald-200">
              REGISTER ACCEPTED · {result.moves} move{result.moves === 1 ? "" : "s"}
              {result.moves <= problem.par ? " · at par" : ` · par is ${problem.par}`}
            </p>
            <p className="font-mono text-xs text-emerald-300/70">
              {result.gained > 0 ? `+${result.gained} XP` : "no new XP (best result already recorded)"}
              {usedHint ? " · hint used (max 2★)" : ""}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => reset()} className="rounded-md border border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-300 hover:bg-slate-800">
              Retry for par
            </button>
            {result.missionFinished ? (
              <button onClick={onMissionComplete} className="inline-flex items-center gap-1 rounded-md bg-emerald-400 px-3 py-1.5 font-mono text-xs font-semibold text-slate-950 hover:bg-emerald-300">
                Mission complete: debrief <ChevronRight size={12} />
              </button>
            ) : nextIndex >= 0 && nextIndex !== index ? (
              <button onClick={() => goTo(nextIndex)} className="inline-flex items-center gap-1 rounded-md bg-cyan-400 px-3 py-1.5 font-mono text-xs font-semibold text-slate-950 hover:bg-cyan-300">
                Next register <ChevronRight size={12} />
              </button>
            ) : (
              <button onClick={onExit} className="inline-flex items-center gap-1 rounded-md bg-cyan-400 px-3 py-1.5 font-mono text-xs font-semibold text-slate-950 hover:bg-cyan-300">
                Back to map <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <Workspace
        exploration={exploration}
        onExplorationChange={onExplorationChange}
        tactics={tactics}
        solved={solved}
        isGoal={(n) => goalReached(problem.goal, n)}
        locked={!!result}
        hint={hint}
        drawerTitle="Instruction set"
      />
    </div>
  );
}
