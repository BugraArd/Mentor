import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  icon,
  accentClass = "text-accent",
  description,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  accentClass?: string;
  description?: string;
}) {
  return (
    <div className="glass-card p-5 transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-3 mb-3">
        <div className={accentClass}>{icon}</div>
        <span className="text-sm font-medium text-ink-soft">{title}</span>
      </div>
      <p className="stat-number text-3xl font-bold">{value}</p>
      {description && (
        <p className="text-xs text-ink-faint mt-1.5 leading-snug">
          {description}
        </p>
      )}
    </div>
  );
}
