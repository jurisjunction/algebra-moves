import { CheckCircle2, ChevronRight, CircleDashed, Lock, Play, RadioTower, Skull, Star } from "lucide-react";
import { useState } from "react";
import { CHAPTERS, OUTLINE } from "../index";
import {
  chapterComplete,
  chapterUnlocked,
  missionProblemsDone,
  missionState,
  nextMission,
  type Progress,
} from "../progress";
import type { ChapterDef, MissionDef } from "../types";

interface Props {
  progress: Progress;
  onPlay: (m: MissionDef) => void;
  onReplayIntro: (c: ChapterDef) => void;
  onOpenSkills: () => void;
}

const starsIn = (p: Progress, m: MissionDef) => m.problems.reduce((s, x) => s + (p.solved[x.id]?.stars ?? 0), 0);

export function MapView({ progress, onPlay, onReplayIntro, onOpenSkills }: Props) {
  const next = nextMission(progress);
  const defaultChapter = next ? CHAPTERS.find((c) => c.missions.includes(next))!.number : 1;
  const [selected, setSelected] = useState(defaultChapter);
  const chapter = CHAPTERS.find((c) => c.number === selected);
  const outline = OUTLINE.find((o) => o.number === selected)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 px-2 font-mono text-[11px] tracking-[0.3em] text-slate-500 uppercase">Sectors</p>
        <ol className="space-y-1">
          {OUTLINE.map((o) => {
            const c = CHAPTERS.find((x) => x.number === o.number);
            const playable = !!c && chapterUnlocked(progress, c);
            const done = !!c && chapterComplete(progress, c);
            const active = o.number === selected;
            return (
              <li key={o.number}>
                <button
                  onClick={() => setSelected(o.number)}
                  className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${
                    active ? "bg-cyan-400/10 ring-1 ring-cyan-400/40" : "hover:bg-slate-800/60"
                  }`}
                >
                  <span className={`w-6 text-right font-mono text-xs ${playable ? "text-cyan-300" : "text-slate-600"}`}>
                    {String(o.number).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-mono text-sm tracking-wider ${playable ? "text-slate-100" : "text-slate-500"}`}>
                      {o.codename}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{o.aopsTitle}</span>
                  </span>
                  {done ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : playable ? (
                    <CircleDashed size={16} className="text-cyan-400" />
                  ) : (
                    <Lock size={14} className="text-slate-600" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-cyan-400/70 uppercase">
              Sector {String(outline.number).padStart(2, "0")} · {outline.aopsTitle}
            </p>
            <h2 className="glow-cyan font-mono text-2xl font-semibold tracking-widest text-cyan-100">{outline.codename}</h2>
          </div>
          {chapter && chapterUnlocked(progress, chapter) && (
            <div className="flex gap-2">
              <button
                onClick={() => onReplayIntro(chapter)}
                className="rounded-md border border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-300 hover:bg-slate-800"
              >
                Replay transmission
              </button>
              {next && chapter.missions.includes(next) && (
                <button
                  onClick={() => onPlay(next)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-cyan-400 px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-slate-950 hover:bg-cyan-300"
                >
                  <Play size={12} /> CONTINUE · {next.id}
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate-400">{outline.teaser}</p>

        {!chapter ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-700 p-6 font-mono text-sm text-slate-500">
            <RadioTower size={18} className="animate-pulse text-slate-600" />
            SIGNAL LOST · SECTOR SEALED · AWAITING CHAPTER DATA
          </div>
        ) : !chapterUnlocked(progress, chapter) ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-700 p-6 font-mono text-sm text-slate-500">
            <Lock size={16} /> Restore the previous sector to unseal this one.
          </div>
        ) : (
          <ol className="space-y-2">
            {chapter.missions.map((m) => (
              <MissionRow key={m.id} mission={m} progress={progress} onPlay={onPlay} onOpenSkills={onOpenSkills} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function MissionRow({
  mission: m,
  progress,
  onPlay,
  onOpenSkills,
}: {
  mission: MissionDef;
  progress: Progress;
  onPlay: (m: MissionDef) => void;
  onOpenSkills: () => void;
}) {
  const state = missionState(progress, m);
  const stars = starsIn(progress, m);
  const solved = missionProblemsDone(progress, m);
  const missing = (m.requires ?? []).filter((s) => !progress.owned.includes(s));
  const clickable = state === "open" || state === "done";

  return (
    <li>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 transition ${
          state === "locked"
            ? "border-slate-800/60 bg-slate-950/30 opacity-50"
            : state === "done"
              ? "border-emerald-500/30 bg-emerald-500/[0.04]"
              : m.boss
                ? "border-rose-400/40 bg-rose-500/[0.05]"
                : "border-slate-700 bg-slate-950/40"
        }`}
      >
        <span className="w-10 font-mono text-xs text-slate-500">{m.id}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {m.boss && <Skull size={14} className="text-rose-300" />}
            <span className="font-mono text-sm font-semibold tracking-wider text-slate-100">{m.title}</span>
            {m.optional && <span className="rounded bg-fuchsia-500/15 px-1.5 font-mono text-[10px] text-fuchsia-300">OPTIONAL</span>}
          </div>
          <p className="text-xs text-slate-500">{m.section}</p>
          {state === "needs-skill" && (
            <button onClick={onOpenSkills} className="mt-1 font-mono text-[11px] text-amber-300 hover:underline">
              Requires module{missing.length > 1 ? "s" : ""} {missing.join(", ")}. Compile in the instruction set →
            </button>
          )}
        </div>
        {state !== "locked" && (
          <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
            <Star size={12} className={stars ? "fill-amber-300 text-amber-300" : "text-slate-600"} />
            {stars}/{m.problems.length * 3}
            <span className="ml-2 text-slate-600">
              {solved}/{m.problems.length}
            </span>
          </span>
        )}
        {clickable ? (
          <button
            onClick={() => onPlay(m)}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-xs font-semibold ${
              state === "done" ? "border border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            }`}
          >
            {state === "done" ? "Replay" : solved ? "Resume" : "Launch"} <ChevronRight size={12} />
          </button>
        ) : (
          <Lock size={14} className="text-slate-600" />
        )}
      </div>
    </li>
  );
}
