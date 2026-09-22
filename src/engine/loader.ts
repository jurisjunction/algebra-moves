import type { TacticPlugin } from "../types/tactic";
import { registry, type TacticRegistry } from "./registry";

/**
 * Auto-registers every file in `src/tactics/` whose default export is a `TacticPlugin[]`.
 * Files are loaded in filename order, so prefix them to control drawer order
 * (e.g. `ch1_01_addition.ts`, `ch2_01_fractions.ts`).
 */
const modules = import.meta.glob<{ default?: unknown }>("../tactics/*.ts", { eager: true });

let loaded = false;

export function loadTactics(target: TacticRegistry = registry): TacticRegistry {
  if (loaded && target === registry) return target;
  for (const path of Object.keys(modules).sort()) {
    const tactics = modules[path].default;
    if (!Array.isArray(tactics)) continue; // shared helper modules have no default export
    target.registerAll(tactics as TacticPlugin[]);
  }
  if (target === registry) loaded = true;
  return target;
}
