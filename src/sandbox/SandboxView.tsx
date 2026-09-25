import type { MathNode } from "mathjs";
import { useMemo, useState } from "react";
import { ProblemBar } from "../components/ProblemBar";
import { Workspace } from "../components/Workspace";
import { isEquation, isSym, literalValue } from "../engine/ast";
import { parseProblem, ParseError } from "../engine/parse";
import { registry } from "../engine/registry";
import { back, explore, moveTo, type Exploration } from "../engine/exploration";
import { initialState } from "../engine/transformer";
import { PRESETS } from "../problems/presets";

/** A single number, or an equation `x = number`. */
function isSolved(n: MathNode): boolean {
  if (literalValue(n) !== null) return true;
  if (isEquation(n)) {
    const [l, r] = n.args;
    return (isSym(l) && literalValue(r) !== null) || (isSym(r) && literalValue(l) !== null);
  }
  return false;
}

/** Unrestricted simulator: every registered rule, any problem. */
export function SandboxView() {
  const [presetId, setPresetId] = useState<string | null>(PRESETS[0].id);
  const [exploration, setExploration] = useState<Exploration>(() => explore(initialState(parseProblem(PRESETS[0].input))));
  const tactics = useMemo(() => registry.getAll(), []);
  const start = (expr: MathNode) => setExploration(explore(initialState(expr)));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p className="mb-3 font-mono text-xs tracking-widest text-slate-500 uppercase">
          Simulator · unrestricted instruction set · progress is not recorded
        </p>
        <ProblemBar
          presetId={presetId}
          canUndo={exploration.current !== 0}
          onLoadPreset={(id) => {
            const p = PRESETS.find((x) => x.id === id);
            if (!p) return;
            setPresetId(id);
            start(parseProblem(p.input));
          }}
          onLoadCustom={(input) => {
            try {
              const expr = parseProblem(input);
              setPresetId(null);
              start(expr);
              return null;
            } catch (e) {
              return e instanceof ParseError ? e.message : String(e);
            }
          }}
          onUndo={() => setExploration(back)}
          onReset={() => setExploration((ex) => moveTo(ex, 0))}
        />
      </div>
      <Workspace
        exploration={exploration}
        onExplorationChange={setExploration}
        tactics={tactics}
        solved={isSolved(exploration.nodes[exploration.current].state.exprNode)}
        isGoal={isSolved}
      />
    </div>
  );
}
