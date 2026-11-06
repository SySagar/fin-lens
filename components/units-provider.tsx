"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";
import type { FxRate } from "@/lib/fx";
import {
  convertFromCrore,
  formatFlow,
  formatNumber,
  type Unit,
} from "@/lib/units";

const STORAGE_KEY = "fin-lens-unit";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };

  listeners.add(onChange);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Unit {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "usd-billion" ? "usd-billion" : "crore";
}

function getServerSnapshot(): Unit {
  return "crore";
}

type UnitsContextValue = {
  unit: Unit;
  setUnit: (unit: Unit) => void;
  fx: FxRate | null;
  formatFlow: (valueInCrore: number, maxDecimals?: number) => string;
  formatNumber: (value: number, maxDecimals?: number) => string;
  convert: (valueInCrore: number) => number;
};

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const unit = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [fx, setFx] = useState<FxRate | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRate() {
      try {
        const response = await fetch("/api/fx", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = (await response.json()) as FxRate;
        if (!controller.signal.aborted && Number.isFinite(data.rate)) {
          setFx(data);
        }
      } catch {
        // The unit switch falls back to an em dash when no rate is available.
      }
    }

    loadRate();
    return () => controller.abort();
  }, []);

  const setUnit = useCallback((next: Unit) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    emit();
  }, []);

  const usdInr = fx?.rate ?? null;

  const value = useMemo<UnitsContextValue>(
    () => ({
      unit,
      setUnit,
      fx,
      formatFlow: (valueInCrore, maxDecimals) =>
        formatFlow(valueInCrore, unit, usdInr, maxDecimals),
      formatNumber: (value, maxDecimals) =>
        formatNumber(value, unit, maxDecimals),
      convert: (valueInCrore) =>
        convertFromCrore(valueInCrore, unit, usdInr),
    }),
    [unit, setUnit, fx, usdInr],
  );

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error("useUnits must be used inside UnitsProvider");
  }
  return context;
}
