import { create } from 'zustand';

interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  compactMode: boolean;
  loaded: boolean;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setDarkMode: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  applySettings: (settings: { primary_color?: string; secondary_color?: string; dark_mode?: boolean; compact_mode?: boolean }) => void;
}

const STORAGE_KEY = 'app_theme';

function loadFromStorage(): Partial<ThemeState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveToStorage(state: Pick<ThemeState, 'primaryColor' | 'secondaryColor' | 'darkMode' | 'compactMode'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const stored = loadFromStorage();

export const useThemeStore = create<ThemeState>((set, get) => ({
  primaryColor: stored.primaryColor || '#1976d2',
  secondaryColor: stored.secondaryColor || '#f9a825',
  darkMode: stored.darkMode ?? false,
  compactMode: stored.compactMode ?? false,
  loaded: !!localStorage.getItem(STORAGE_KEY),

  setPrimaryColor: (color) => {
    set({ primaryColor: color });
    saveToStorage(get());
  },
  setSecondaryColor: (color) => {
    set({ secondaryColor: color });
    saveToStorage(get());
  },
  setDarkMode: (enabled) => {
    set({ darkMode: enabled });
    saveToStorage(get());
  },
  setCompactMode: (enabled) => {
    set({ compactMode: enabled });
    saveToStorage(get());
  },
  applySettings: (settings) => {
    const updates: Partial<ThemeState> = {};
    if (settings.primary_color !== undefined) updates.primaryColor = settings.primary_color;
    if (settings.secondary_color !== undefined) updates.secondaryColor = settings.secondary_color;
    if (settings.dark_mode !== undefined) updates.darkMode = settings.dark_mode;
    if (settings.compact_mode !== undefined) updates.compactMode = settings.compact_mode;
    set({ ...updates, loaded: true });
    saveToStorage({ ...get(), ...updates } as any);
  },
}));
