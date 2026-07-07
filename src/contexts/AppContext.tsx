import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSettings, saveSettings } from "../lib/db";
import type { Settings, Units } from "../types";

interface AppContextType {
  settings: Settings | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getSettings();
        setSettings(s);
        
        if (s.theme === "dark" || (s.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
    
    if (newSettings.theme) {
      if (newSettings.theme === "dark" || (newSettings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
