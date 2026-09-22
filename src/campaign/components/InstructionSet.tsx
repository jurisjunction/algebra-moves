import { Cpu, Lock, ScrollText, Sparkles, Wrench, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tex } from "../../components/Tex";
import { registry } from "../../engine/registry";
import { SKILLS } from "../index";
import { compileStatus, type Progress } from "../progress";
import type { SkillDef, SkillKind } from "../types";

const KIND: Record<SkillKind, { label: string; icon: typeof Cpu; color: string }> = {
  axiom: { label: "Axiom modules", icon: Cpu, color: "text-cyan-300" },
  tool: { label: "Tools", icon: Wrench, color: "text-amber-300" },
  daemon: { label: "Daemons", icon: Zap, color: "text-fuchsia-300" },
  theorem: { label: "Theorems", icon: ScrollText, color: "text-emerald-300" },
};

interface Props {
  progress: Progress;
  onCompile: (skill: SkillDef) => void;
  onClose: () => void;
}

export function InstructionSet({ progress, onCompile, onClose }: Props) {
  const [compiling, setCompiling] = useState<SkillDef | null>(null);
  const all = [...SKILLS.values()];
  const owned = all.filter((s) => progress.owned.includes(s.id));
  const pending = all.filter((s) => !progress.owned.includes(s.id) && s.compile && compileStatus(progress, s));
  const ready = pending.filter((s) => compileStatus(progress, s)!.ready);
  // Show a compile target once the player has reached the missions it depends on.
  const inProgress = pending.filter(
    (s) => !compileStatus(progress, s)!.ready && (s.compile?.missions ?? []).every((m) => progress.missionsStarted.includes(m)),
  );
  const unknown = all.length - owned.length - ready.length - inProgress.length;

  useEffect(() => {
    // The compile has already been applied, so closing mid-animation loses nothing.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rise flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-cyan-400/70 uppercase">/sys/lattice/bin</p>
            <h2 className="font-mono text-lg font-semibold tracking-widest text-slate-100">INSTRUCTION SET</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {compiling && <CompileLog skill={compiling} onDone={() => setCompiling(null)} />}

          {ready.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 font-mono text-xs tracking-widest text-emerald-300 uppercase">
                <Sparkles size={14} /> Ready to compile
              </h3>
              <div className="space-y-2">
                {ready.map((s) => (
                  <SkillCard key={s.id} skill={s} progress={progress}>
                    <button
                      onClick={() => {
                        setCompiling(s);
                        onCompile(s);
                      }}
                      className="mt-2 w-full rounded bg-emerald-400 py-1.5 font-mono text-sm font-semibold tracking-widest text-slate-950 hover:bg-emerald-300"
                    >
                      COMPILE {s.id}
                    </button>
                  </SkillCard>
                ))}
              </div>
            </section>
          )}

          {inProgress.length > 0 && (
            <section>
              <h3 className="mb-2 font-mono text-xs tracking-widest text-slate-400 uppercase">Compiling requires practice</h3>
              <div className="space-y-2">
                {inProgress.map((s) => (
                  <SkillCard key={s.id} skill={s} progress={progress} dim />
                ))}
              </div>
            </section>
          )}

          {(["axiom", "theorem", "tool", "daemon"] as SkillKind[]).map((k) => {
            const list = owned.filter((s) => s.kind === k);
            if (!list.length) return null;
            const { label, icon: Icon, color } = KIND[k];
            return (
              <section key={k}>
                <h3 className={`mb-2 flex items-center gap-2 font-mono text-xs tracking-widest uppercase ${color}`}>
                  <Icon size={14} /> {label} · {list.length}
                </h3>
                <div className="space-y-2">
                  {list.map((s) => (
                    <SkillCard key={s.id} skill={s} progress={progress} />
                  ))}
                </div>
              </section>
            );
          })}

          {unknown > 0 && (
            <p className="flex items-center gap-2 font-mono text-xs text-slate-600">
              <Lock size={12} /> {unknown} module{unknown === 1 ? "" : "s"} not yet discovered
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillCard({ skill, progress, dim, children }: { skill: SkillDef; progress: Progress; dim?: boolean; children?: React.ReactNode }) {
  const status = compileStatus(progress, skill);
  const owned = progress.owned.includes(skill.id);
  const { icon: Icon, color } = KIND[skill.kind];
  const rules = skill.tactics.map((id) => registry.getById(id)).filter((t) => t && t.direction !== "introduce");
  return (
    <div className={`rounded-md border border-slate-800 bg-slate-900/60 p-3 ${dim ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <span className="font-mono text-sm font-semibold text-slate-100">{skill.id}</span>
        <span className="text-sm text-slate-400">{skill.title}</span>
        {owned && (progress.uses[skill.id] ?? 0) > 0 && (
          <span className="ml-auto font-mono text-[11px] text-slate-500">×{progress.uses[skill.id]}</span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{skill.lore}</p>
      {rules.length > 0 && (
        <div className="mt-2 space-y-0.5 text-[0.8rem] text-slate-300">
          {rules.slice(0, 6).map((t) => (
            <div key={t!.id} className="overflow-x-auto">
              {t!.ruleLatex ? <Tex latex={t!.ruleLatex} /> : t!.name}
            </div>
          ))}
          {rules.length > 6 && <div className="font-mono text-[11px] text-slate-500">+{rules.length - 6} more</div>}
        </div>
      )}
      {!owned && status && (
        <div className="mt-2 space-y-1">
          {status.requirements.map((r) => (
            <div key={r.label} className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="w-40 truncate">{r.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800">
                <div
                  className={`h-full ${r.have >= r.need ? "bg-emerald-400" : "bg-cyan-500"}`}
                  style={{ width: `${(100 * r.have) / r.need}%` }}
                />
              </div>
              <span className="w-10 text-right">
                {r.have}/{r.need}
              </span>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/** A short fake linker log: the compile "animation". */
function CompileLog({ skill, onDone }: { skill: SkillDef; onDone: () => void }) {
  const deps = [...Object.keys(skill.compile?.uses ?? {}), ...(skill.compile?.missions ?? []).map((m) => `trace-${m}`)];
  const lines = [
    `$ lattice-cc --emit ${skill.kind} ${skill.id}`,
    ...deps.map((d) => `  linking ${d}.o`),
    `  verifying soundness… every rewrite justified`,
    `  ✓ ${skill.id} installed → /sys/lattice/bin/${skill.id}`,
  ];
  const [n, setN] = useState(1);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (n >= lines.length) {
      const t = setTimeout(() => done.current(), 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n + 1), 280);
    return () => clearTimeout(t);
  }, [n, lines.length]);
  return (
    <div className="rise rounded-md border border-emerald-400/40 bg-black/60 p-3 font-mono text-xs text-emerald-300">
      {lines.slice(0, n).map((l, i) => (
        <div key={i} className={i === n - 1 && n < lines.length ? "caret" : ""}>
          {l}
        </div>
      ))}
    </div>
  );
}
