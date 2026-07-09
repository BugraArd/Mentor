"use client";

import type { RubricCriterion, RubricScore } from "@/lib/database.types";

export function RubricScorer({
  criteria,
  scores,
  onChange,
}: {
  criteria: RubricCriterion[];
  scores: RubricScore[];
  onChange: (scores: RubricScore[]) => void;
}) {
  const totalScore = scores.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const maxScore = criteria.reduce((sum, c) => sum + c.points, 0);

  function handleScoreChange(index: number, value: number) {
    const next = [...scores];
    next[index] = { ...next[index], score: value };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-ink-soft uppercase tracking-wider">
        Rubrik Puanlama
      </h4>

      <div className="space-y-3">
        {criteria.map((criterion, i) => {
          const score = scores[i]?.score ?? 0;
          const pct = criterion.points > 0 ? (score / criterion.points) * 100 : 0;

          return (
            <div key={i} className="rounded-xl bg-surface-2 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink">
                  {criterion.label}
                </label>
                <span className="text-sm font-bold tabular-nums text-ink">
                  <span
                    className={
                      pct >= 80
                        ? "text-go"
                        : pct >= 50
                        ? "text-time"
                        : "text-ink-soft"
                    }
                  >
                    {score}
                  </span>
                  <span className="text-ink-faint">/{criterion.points}</span>
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={criterion.points}
                value={score}
                onChange={(e) =>
                  handleScoreChange(i, parseInt(e.target.value, 10))
                }
                className="w-full accent-accent h-2 rounded-full appearance-none bg-line cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-125"
              />

              {/* Progress bar visual */}
              <div className="h-1 rounded-full bg-line overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pct >= 80
                      ? "bg-go"
                      : pct >= 50
                      ? "bg-time"
                      : "bg-accent"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="rounded-xl bg-surface p-4 flex items-center justify-between border border-line">
        <span className="text-sm font-semibold text-ink-soft">
          Toplam Puan
        </span>
        <span className="stat-number bg-gradient-to-r from-accent to-future bg-clip-text text-transparent">
          {totalScore}/{maxScore}
        </span>
      </div>
    </div>
  );
}
