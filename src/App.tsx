import { Brackets, Cpu, FlaskConical, Hexagon, Map as MapIcon, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CampaignView } from "./campaign/CampaignView";
import { InstructionSet } from "./campaign/components/InstructionSet";
import { compilable, compileSkill, levelOf, loadProgress, NEW_GAME, saveProgress, type Progress } from "./campaign/progress";
import { DisplayContext, loadDisplayPrefs, saveDisplayPrefs, type DisplayPrefs } from "./components/display";
import { SandboxView } from "./sandbox/SandboxView";

type Mode = "campaign" | "sandbox";

export default function App() {
  const [mode, setMode] = useState<Mode>("campaign");
  const [progress, setProgressState] = useState<Progress>(loadProgress);
  const [showSkills, setShowSkills] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [campaignKey, setCampaignKey] = useState(0);
  const [display, setDisplay] = useState<DisplayPrefs>(loadDisplayPrefs);

  useEffect(() => saveDisplayPrefs(display), [display]);

  const setProgress = useCallback((update: (p: Progress) => Progress) => setProgressState(update), []);

  useEffect(() => saveProgress(progress), [progress]);

  // Announce modules that just became compilable.
  const ready = compilable(progress).map((s) => s.id);
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!known.current) {
      known.current = new Set(ready);
      return;
    }
    const fresh = ready.filter((id) => !known.current!.has(id));
    ready.forEach((id) => known.current!.add(id));
    if (fresh.length) {
      const added = fresh.map((id) => ({ id: Date.now() + Math.random(), text: id }));
      setToasts((t) => [...t, ...added]);
      setTimeout(() => setToasts((t) => t.filter((x) => !added.includes(x))), 8000);
    }
    // Drop toasts for modules that are no longer waiting (compiled).
    setToasts((t) => t.filter((x) => ready.includes(x.text)));
  }, [ready.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const lvl = levelOf(progress.xp);

  return (
    <DisplayContext.Provider value={display}>
      <div className="lattice-bg min-h-screen text-slate-200">
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Hexagon className="text-cyan-400" size={22} />
              <div>
                <h1 className="glow-cyan font-mono text-base font-semibold tracking-[0.25em] text-cyan-100">THE LATTICE</h1>
                <p className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">algebra moves · every step a proof</p>
              </div>
            </div>

            <nav className="flex rounded-md border border-slate-800 p-0.5 font-mono text-xs">
              {(
                [
                  ["campaign", "Campaign", MapIcon],
                  ["sandbox", "Simulator", FlaskConical],
                ] as const
              ).map(([m, label, Icon]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1 ${mode === m ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setDisplay((d) => ({ ...d, explicitGrouping: !d.explicitGrouping }))}
              title={
                display.explicitGrouping
                  ? "Every grouping is bracketed, e.g. (a + b) + c: exactly what the rules act on. Click for conventional notation."
                  : "Conventional notation: left-to-right chains drop their brackets, e.g. a + b + c. Click to bracket every grouping."
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 px-2.5 py-1 font-mono text-xs text-slate-400 hover:text-slate-200"
            >
              <Brackets size={12} className={display.explicitGrouping ? "text-cyan-300" : ""} />
              {display.explicitGrouping ? "(a+b)+c" : "a+b+c"}
            </button>

            {mode === "campaign" && (
              <div className="ml-auto flex items-center gap-4">
                <div className="w-56" title={`${progress.xp} XP total`}>
                  <div className="flex justify-between gap-2 font-mono text-[11px] whitespace-nowrap">
                    <span className="truncate text-slate-300">
                      LV {lvl.level} · {lvl.title}
                    </span>
                    <span className="text-slate-500">{progress.xp} XP</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-400" style={{ width: `${(100 * lvl.into) / lvl.next}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => setShowSkills(true)}
                  className="relative inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-200 hover:border-cyan-400/60 hover:bg-slate-900"
                >
                  <Cpu size={14} className="text-cyan-300" /> Instruction set
                  <span className="text-slate-500">{progress.owned.length}</span>
                  {ready.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-slate-950">
                      {ready.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          {mode === "campaign" ? (
            <>
              <CampaignView key={campaignKey} progress={progress} setProgress={setProgress} onOpenSkills={() => setShowSkills(true)} />
              <footer className="mt-10 flex justify-end">
                <button
                  onClick={() => {
                    if (confirm("Erase all campaign progress? This cannot be undone.")) {
                      setProgressState(NEW_GAME);
                      known.current = null;
                      setCampaignKey((k) => k + 1);
                    }
                  }}
                  className="font-mono text-[11px] text-slate-600 hover:text-rose-400"
                >
                  wipe memory core (reset progress)
                </button>
              </footer>
            </>
          ) : (
            <SandboxView />
          )}
        </main>

        {showSkills && (
          <InstructionSet
            progress={progress}
            onCompile={(s) => setProgress((p) => compileSkill(p, s))}
            onClose={() => setShowSkills(false)}
          />
        )}

        <div className="fixed right-4 bottom-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="rise flex items-center gap-3 rounded-md border border-emerald-400/50 bg-slate-950/95 px-4 py-3 shadow-[0_0_24px_-6px_rgb(52_211_153/0.6)]"
            >
              <Sparkles size={16} className="text-emerald-300" />
              <button
                className="text-left"
                onClick={() => {
                  setShowSkills(true);
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
              >
                <p className="font-mono text-xs font-semibold tracking-widest text-emerald-200">MODULE READY TO COMPILE</p>
                <p className="font-mono text-sm text-slate-200">{t.text}</p>
              </button>
              <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="text-slate-500 hover:text-slate-200" aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </DisplayContext.Provider>
  );
}
