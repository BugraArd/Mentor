export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? "bg-accent text-white ring-4 ring-accent-wash shadow-md"
                    : isCompleted
                    ? "bg-go text-white"
                    : "bg-surface-2 text-ink-faint"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? "text-accent-ink"
                    : isCompleted
                    ? "text-go"
                    : "text-ink-faint"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${
                  isCompleted ? "bg-go" : "bg-surface-2"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
