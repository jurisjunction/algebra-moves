import { useState } from "react";
import { Dialogue } from "./components/Dialogue";
import { MapView } from "./components/MapView";
import { MissionView } from "./components/MissionView";
import { MISSION_CHAPTER, SKILLS } from "./index";
import { chapterComplete, missionById, startMission, type Progress } from "./progress";
import type { ChapterDef, Line, MissionDef } from "./types";

type Screen =
  | { kind: "map" }
  | { kind: "mission"; id: string }
  | { kind: "dialogue"; title: string; subtitle: string; lines: Line[]; doneLabel?: string; onDone: () => void };

interface Props {
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onOpenSkills: () => void;
}

/** Sequences the story: chapter transmission → briefing → mission → debrief → chapter outro. */
export function CampaignView({ progress, setProgress, onOpenSkills }: Props) {
  const [screen, setScreen] = useState<Screen>({ kind: "map" });

  const toMap = () => setScreen({ kind: "map" });

  const moduleLines = (m: MissionDef): Line[] =>
    (m.grants ?? [])
      .filter((s) => !progress.owned.includes(s))
      .map((s) => ({ who: "SYSTEM", text: `NEW MODULE · **${s}** · ${SKILLS.get(s)?.title ?? ""}` }));

  const openMission = (m: MissionDef) => {
    if (progress.missionsStarted.includes(m.id)) {
      setScreen({ kind: "mission", id: m.id });
      return;
    }
    setScreen({
      kind: "dialogue",
      title: m.title,
      subtitle: `Mission ${m.id} · ${m.section}`,
      lines: [...m.briefing, ...moduleLines(m)],
      doneLabel: "Begin",
      onDone: () => {
        setProgress((p) => startMission(p, m));
        setScreen({ kind: "mission", id: m.id });
      },
    });
  };

  const play = (m: MissionDef) => {
    const chapter = MISSION_CHAPTER.get(m.id)!;
    if (progress.chaptersSeen.includes(chapter.number)) return openMission(m);
    setScreen({
      kind: "dialogue",
      title: chapter.codename,
      subtitle: `Sector ${String(chapter.number).padStart(2, "0")} · ${chapter.aopsTitle}`,
      lines: chapter.intro,
      doneLabel: "Proceed",
      onDone: () => {
        setProgress((p) => ({ ...p, chaptersSeen: [...p.chaptersSeen, chapter.number] }));
        openMission(m);
      },
    });
  };

  const replayIntro = (c: ChapterDef) =>
    setScreen({
      kind: "dialogue",
      title: c.codename,
      subtitle: `Sector ${String(c.number).padStart(2, "0")} · ${c.aopsTitle}`,
      lines: c.intro,
      onDone: toMap,
    });

  const completeMission = (m: MissionDef) => {
    const chapter = MISSION_CHAPTER.get(m.id)!;
    const outro = () =>
      setScreen({
        kind: "dialogue",
        title: `${chapter.codename} · RESTORED`,
        subtitle: `Sector ${String(chapter.number).padStart(2, "0")} complete`,
        lines: chapter.outro,
        doneLabel: "Return to map",
        onDone: toMap,
      });
    setScreen({
      kind: "dialogue",
      title: `${m.title} · COMPLETE`,
      subtitle: `Mission ${m.id} debrief`,
      lines: m.debrief,
      doneLabel: chapterComplete(progress, chapter) ? "Continue" : "Return to map",
      onDone: chapterComplete(progress, chapter) && !m.optional ? outro : toMap,
    });
  };

  if (screen.kind === "dialogue") {
    return (
      <Dialogue
        key={screen.title + screen.subtitle}
        title={screen.title}
        subtitle={screen.subtitle}
        lines={screen.lines}
        doneLabel={screen.doneLabel}
        onDone={screen.onDone}
      />
    );
  }

  if (screen.kind === "mission") {
    const m = missionById(screen.id)!;
    return (
      <MissionView
        key={m.id}
        mission={m}
        progress={progress}
        setProgress={setProgress}
        onExit={toMap}
        onBriefing={() =>
          setScreen({
            kind: "dialogue",
            title: m.title,
            subtitle: `Mission ${m.id} · briefing`,
            lines: m.briefing,
            doneLabel: "Back to mission",
            onDone: () => setScreen({ kind: "mission", id: m.id }),
          })
        }
        onMissionComplete={() => completeMission(m)}
      />
    );
  }

  return <MapView progress={progress} onPlay={play} onReplayIntro={replayIntro} onOpenSkills={onOpenSkills} />;
}
