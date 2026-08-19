import * as React from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'steno-theme';

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function normalize(value: string | null): Theme {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'system';
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    return normalize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private-mode / disabled storage — fall back to following the system.
    return 'system';
  }
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
}

function applyResolved(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  // The design-v2 token layer keys off [data-theme="dark"] in addition to
  // .dark, so mirror the class onto the attribute for both designs.
  document.documentElement.setAttribute('data-theme', resolved);
}

// Single source of truth shared by every useTheme() consumer. Each hook
// instance used to keep its own useState copy, so persistent chrome (the
// toolbar's sun/moon button) went stale when the preference changed anywhere
// else — e.g. via the Appearance control in Settings.
interface Snapshot {
  theme: Theme;
  resolved: ResolvedTheme;
}

const listeners = new Set<() => void>();

let snapshot: Snapshot = (() => {
  const theme = readStoredTheme();
  return { theme, resolved: resolve(theme) };
})();

function getSnapshot(): Snapshot {
  return snapshot;
}

function commit(theme: Theme) {
  const resolved = resolve(theme);
  applyResolved(resolved);
  if (theme === snapshot.theme && resolved === snapshot.resolved) return;
  snapshot = { theme, resolved };
  for (const listener of listeners) listener();
}

export function setTheme(next: Theme) {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference won't survive a relaunch, but still apply it this session.
    }
  }
  commit(next);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== 'undefined') {
  // Paint the stored preference before first render so there's no flash of
  // the wrong theme.
  applyResolved(snapshot.resolved);

  // Always listen: the OS can flip while the preference is 'system'.
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (snapshot.theme === 'system') commit('system');
    });

  // Keep other renderer windows in step when one of them changes the setting.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    commit(normalize(event.newValue));
  });
}

export function useTheme() {
  const { theme, resolved } = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  return { theme, setTheme, resolved };
}
