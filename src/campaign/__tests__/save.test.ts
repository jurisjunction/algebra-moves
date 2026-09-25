import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MISSIONS, SKILLS } from "../index";
import { BACKUP_PREFIX, loadProgress, NEW_GAME, readSave, SAVE_KEY } from "../progress";
import saveV1 from "./fixtures/save-v1.json";

// A real player's progress lives only in their browser. This fixture is a v1 save that touches
// every id shipped as of Ch. 2 §2.2. It is append-only: never regenerate it, and never rename an
// id it contains, or a deployed player's missions silently re-lock.

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
    keys: () => [...m.keys()],
  };
}

let storage: ReturnType<typeof fakeStorage>;
beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("localStorage", storage);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("saved progress", () => {
  it("loads a v1 save unchanged", () => {
    storage.setItem(SAVE_KEY, JSON.stringify(saveV1));
    expect(loadProgress()).toEqual(saveV1);
  });

  it("every id in a shipped save still exists", () => {
    const problems = new Set(MISSIONS.flatMap((m) => m.problems.map((p) => p.id)));
    const missions = new Set(MISSIONS.map((m) => m.id));
    expect(saveV1.owned.filter((s) => !SKILLS.has(s))).toEqual([]);
    expect(Object.keys(saveV1.uses).filter((s) => !SKILLS.has(s))).toEqual([]);
    expect(Object.keys(saveV1.solved).filter((p) => !problems.has(p))).toEqual([]);
    expect(saveV1.missionsDone.filter((m) => !missions.has(m))).toEqual([]);
    expect(saveV1.missionsStarted.filter((m) => !missions.has(m))).toEqual([]);
  });

  it("fills fields a v1 save predates", () => {
    const { progress, unreadable } = readSave(JSON.stringify({ version: 1, xp: 40 }));
    expect(unreadable).toBe(false);
    expect(progress).toEqual({ ...NEW_GAME, xp: 40 });
  });

  it("no save is a new game, not an unreadable one", () => {
    expect(readSave(null)).toEqual({ progress: NEW_GAME, unreadable: false });
  });

  it.each([["unknown version", JSON.stringify({ version: 2, xp: 900 })], ["bad JSON", "{not json"], ["not an object", "[1,2]"]])(
    "keeps a backup of a save it cannot read (%s)",
    (_, raw) => {
      storage.setItem(SAVE_KEY, raw);
      expect(loadProgress()).toEqual(NEW_GAME);
      const backups = storage.keys().filter((k) => k.startsWith(BACKUP_PREFIX));
      expect(backups).toHaveLength(1);
      expect(storage.getItem(backups[0])).toBe(raw);
    },
  );

  it("backs up the same unreadable save only once", () => {
    storage.setItem(SAVE_KEY, "{not json");
    loadProgress();
    loadProgress();
    expect(storage.keys().filter((k) => k.startsWith(BACKUP_PREFIX))).toHaveLength(1);
  });
});
