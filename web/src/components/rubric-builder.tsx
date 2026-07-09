"use client";

import type { RubricCriterion } from "@/lib/database.types";
import { TrashIcon, PlusCircleIcon } from "@/components/icons";

export function RubricBuilder({
  criteria,
  onChange,
}: {
  criteria: RubricCriterion[];
  onChange: (criteria: RubricCriterion[]) => void;
}) {
  const total = criteria.reduce((sum, c) => sum + (c.points || 0), 0);

  function updateCriterion(index: number, field: keyof RubricCriterion, value: string | number) {
    const updated = [...criteria];
    if (field === "points") {
      updated[index] = { ...updated[index], points: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: String(value) };
    }
    onChange(updated);
  }

  function addCriterion() {
    onChange([...criteria, { label: "", points: 10 }]);
  }

  function removeCriterion(index: number) {
    onChange(criteria.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {criteria.map((c, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={c.label}
              onChange={(e) => updateCriterion(i, "label", e.target.value)}
              placeholder="Kriter adı (ör. İçerik)"
              className="input-field"
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              value={c.points}
              onChange={(e) => updateCriterion(i, "points", e.target.value)}
              min={0}
              placeholder="Puan"
              className="input-field text-center"
            />
          </div>
          <button
            type="button"
            onClick={() => removeCriterion(i)}
            className="text-ink-faint hover:text-time transition-colors p-1"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addCriterion}
        className="w-full rounded-xl border-2 border-dashed border-line px-4 py-3 text-sm font-medium text-accent-ink hover:border-accent hover:bg-accent-wash/30 transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircleIcon className="h-4 w-4" />
        Kriter Ekle
      </button>

      {criteria.length > 0 && (
        <div className="flex justify-end items-center gap-2 pt-2">
          <span className="text-sm text-ink-soft">Toplam:</span>
          <span className="stat-number text-xl font-bold">{total} puan</span>
        </div>
      )}
    </div>
  );
}
