"use client";

import { useUnits } from "@/components/units-provider";
import { UNIT_OPTIONS } from "@/lib/units";

export function UnitToggle() {
  const { unit, setUnit } = useUnits();

  return (
    <div
      role="group"
      aria-label="Number units"
      className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-muted p-1"
    >
      {UNIT_OPTIONS.map((option) => {
        const active = unit === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setUnit(option.value)}
            className={`h-7 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
