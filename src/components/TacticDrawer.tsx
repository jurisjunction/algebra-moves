import type { MathNode } from "mathjs";
import { ArrowLeftRight, Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { TacticCategory, TacticParams, TacticPlugin } from "../types/tactic";
import { ParamPopover } from "./ParamPopover";
import { Tex } from "./Tex";

type GroupBy = "section" | "category";

const CATEGORY_LABEL: Record<TacticCategory, string> = {
  axiom: "Axioms & Properties",
  alu: "Arithmetic (ALU)",
  macro: "Macros & Daemons",
};

interface Props {
  tactics: TacticPlugin[];
  applicable: Set<string>;
  pendingId: string | null;
  /** A tactic to draw attention to (e.g. the Custodian's hint). */
  hintId?: string | null;
  target: MathNode;
  targetLatex: string;
  title?: string;
  onChoose: (t: TacticPlugin) => void;
  onSubmitParams: (t: TacticPlugin, params: TacticParams) => string | null;
  onCancelParams: () => void;
}

export function TacticDrawer({
  tactics,
  applicable,
  pendingId,
  hintId,
  target,
  targetLatex,
  title = "Moves",
  onChoose,
  onSubmitParams,
  onCancelParams,
}: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>("section");
  const [onlyApplicable, setOnlyApplicable] = useState(false);
  const [showIntroduce, setShowIntroduce] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tactics.filter(
      (t) =>
        (showIntroduce || t.direction !== "introduce" || t.id === pendingId || t.id === hintId) &&
        (!onlyApplicable || applicable.has(t.id)) &&
        (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    );
  }, [tactics, applicable, onlyApplicable, showIntroduce, query, pendingId, hintId]);

  const groups = useMemo(() => {
    const map = new Map<string, { title: string; subtitle?: string; items: TacticPlugin[] }>();
    for (const t of visible) {
      const k = groupBy === "section" ? `${t.chapter}::${t.section ?? "General"}` : t.category;
      if (!map.has(k)) {
        map.set(
          k,
          groupBy === "section"
            ? { title: t.section ?? "General", subtitle: t.chapter, items: [] }
            : { title: CATEGORY_LABEL[t.category], items: [] },
        );
      }
      map.get(k)!.items.push(t);
    }
    return [...map.values()];
  }, [visible, groupBy]);

  const legalNow = tactics.filter(
    (t) => applicable.has(t.id) && (showIntroduce || t.direction !== "introduce" || t.id === hintId),
  );
  const pending = pendingId ? tactics.find((t) => t.id === pendingId) : undefined;

  let lastChapter: string | undefined;

  return (
    <aside className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="space-y-3 border-b border-slate-800 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-sm font-semibold tracking-widest text-slate-200 uppercase">{title}</h2>
          <span className="font-mono text-xs text-slate-500">
            <span className="font-semibold text-emerald-400">{legalNow.length}</span> legal · {tactics.length} loaded
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rules…"
            className="w-full rounded-md border border-slate-700 bg-slate-950/60 py-1.5 pr-2 pl-8 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <div className="inline-flex rounded-md border border-slate-700 p-0.5">
            {(["section", "category"] as GroupBy[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`rounded px-2 py-0.5 ${groupBy === g ? "bg-cyan-400/20 text-cyan-200" : "hover:bg-slate-800"}`}
              >
                {g === "section" ? "By topic" : "By type"}
              </button>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={onlyApplicable} onChange={(e) => setOnlyApplicable(e.target.checked)} className="accent-cyan-400" />
            Only legal
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5" title="Moves like a → a + 0 that apply to anything">
            <input type="checkbox" checked={showIntroduce} onChange={(e) => setShowIntroduce(e.target.checked)} className="accent-cyan-400" />
            Introducing moves
          </label>
        </div>
        {legalNow.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-[11px] tracking-widest text-emerald-400 uppercase">Legal now</p>
            <div className="flex flex-wrap gap-1.5">
              {legalNow.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChoose(t)}
                  title={t.description}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                    pendingId === t.id
                      ? "border-cyan-300 bg-cyan-400 text-slate-950"
                      : hintId === t.id
                        ? "animate-pulse border-violet-300 bg-violet-500/25 text-violet-100"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {pending && (
          <ParamPopover
            key={`${pending.id}-${targetLatex}`}
            tactic={pending}
            target={target}
            targetLatex={targetLatex}
            onSubmit={(params) => onSubmitParams(pending, params)}
            onCancel={onCancelParams}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {groups.length === 0 && <p className="text-sm text-slate-500">No moves match.</p>}
        {groups.map((g) => {
          const showChapter = g.subtitle && g.subtitle !== lastChapter;
          lastChapter = g.subtitle;
          return (
            <section key={`${g.subtitle}-${g.title}`}>
              {showChapter && <p className="mb-2 font-mono text-[11px] tracking-widest text-cyan-400/80 uppercase">{g.subtitle}</p>}
              <h3 className="mb-1.5 font-mono text-xs tracking-wider text-slate-500 uppercase">{g.title}</h3>
              <ul className="space-y-1.5">
                {g.items.map((t) => (
                  <li key={t.id}>
                    <TacticCard
                      tactic={t}
                      legal={applicable.has(t.id)}
                      active={pendingId === t.id}
                      hinted={hintId === t.id}
                      onClick={() => onChoose(t)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function TacticCard({
  tactic,
  legal,
  active,
  hinted,
  onClick,
}: {
  tactic: TacticPlugin;
  legal: boolean;
  active: boolean;
  hinted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={tactic.description}
      className={`group w-full rounded-md border px-3 py-2 text-left transition ${
        active
          ? "border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/40"
          : hinted
            ? "border-violet-400/70 bg-violet-500/10"
            : legal
              ? "border-emerald-500/40 bg-emerald-500/[0.07] hover:border-emerald-400"
              : "border-slate-800 bg-slate-950/30 opacity-55 hover:opacity-90"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${legal ? "text-slate-100" : "text-slate-400"}`}>{tactic.name}</span>
        {tactic.direction === "reverse" && <ArrowLeftRight size={12} className="shrink-0 text-slate-500" aria-label="reverse direction" />}
        {tactic.direction === "introduce" && <Plus size={12} className="shrink-0 text-slate-500" aria-label="introduces a term" />}
        {legal && <Check size={14} className="ml-auto shrink-0 text-emerald-400" />}
      </div>
      {tactic.ruleLatex && (
        <div className="mt-0.5 overflow-x-auto text-[0.8rem] text-slate-400">
          <Tex latex={tactic.ruleLatex} />
        </div>
      )}
    </button>
  );
}
