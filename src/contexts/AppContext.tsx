import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSettings, saveSettings } from "../lib/db";
import type { Settings, Vehicle, FuelOverride } from "../types";

interface AppContextType {
  settings: Settings | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  activeVehicle: Vehicle | null;
  setFuelOverride: (override: FuelOverride | null) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function applyTheme(theme: Settings["theme"]) {
  if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(s => { setSettings(s); applyTheme(s.theme); })
      .catch(err => console.error("Failed to load settings", err))
      .finally(() => setIsLoading(false));
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
    if (newSettings.theme) applyTheme(newSettings.theme);
  };

  const setFuelOverride = async (override: FuelOverride | null) => {
    if (!settings) return;
    const updated = { ...settings, fuelOverride: override ?? undefined };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Derive the active vehicle from the vehicles list
  const activeVehicle: Vehicle | null = (() => {
    const vList = settings?.vehicles;
    if (vList && vList.length > 0) {
      const id = settings?.activeVehicleId;
      return (id ? vList.find(v => v.id === id) : vList.find(v => !v.status || v.status === "active")) ?? vList[0];
    }
    return settings?.vehicleInfo ?? null;
  })();

  return (
    <AppContext.Provider value={{ settings, updateSettings, activeVehicle, setFuelOverride, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
}
