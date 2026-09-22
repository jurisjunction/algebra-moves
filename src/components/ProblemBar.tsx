import { Play, RotateCcw, Undo2 } from "lucide-react";
import { useState } from "react";
import { PRESETS } from "../problems/presets";

interface Props {
  presetId: string | null;
  canUndo: boolean;
  onLoadPreset: (id: string) => void;
  /** Returns an error message, or null on success. */
  onLoadCustom: (input: string) => string | null;
  onUndo: () => void;
  onReset: () => void;
}

export function ProblemBar({ presetId, canUndo, onLoadPreset, onLoadCustom, onUndo, onReset }: Props) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const preset = PRESETS.find((p) => p.id === presetId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={presetId ?? ""}
          onChange={(e) => {
            setError(null);
            onLoadPreset(e.target.value);
          }}
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
          aria-label="Preset problem"
        >
          {presetId === null && <option value="">Custom problem</option>}
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const err = onLoadCustom(custom);
            setError(err);
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Your own: 3(x + 2) = 12,  8 / 4,  recip(5) * 5"
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            aria-label="Custom problem"
          />
          <button type="submit" className="inline-flex items-center gap-1 rounded-md bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
            <Play size={14} /> Load
          </button>
        </form>

        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title="Undo last move (Ctrl+Z)"
          >
            <Undo2 size={14} /> Undo
          </button>
          <button
            onClick={onReset}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title="Back to the starting position"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : (
        preset && (
          <p className="text-sm text-slate-500">
            <span className="font-mono text-xs tracking-wider text-cyan-400/80 uppercase">Goal</span> {preset.goal}
          </p>
        )
      )}
    </div>
  );
}
