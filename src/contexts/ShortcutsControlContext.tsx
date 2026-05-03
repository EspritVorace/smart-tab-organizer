import React, { createContext, useContext, useMemo } from 'react';

export interface ShortcutsControlContextValue {
  openShortcuts: () => void;
  version: string;
}

const defaultValue: ShortcutsControlContextValue = {
  openShortcuts: () => undefined,
  version: '',
};

const ShortcutsControlContext = createContext<ShortcutsControlContextValue>(defaultValue);

export function useShortcutsControl(): ShortcutsControlContextValue {
  return useContext(ShortcutsControlContext);
}

interface ShortcutsControlProviderProps {
  openShortcuts: () => void;
  version: string;
  children: React.ReactNode;
}

export function ShortcutsControlProvider({
  openShortcuts,
  version,
  children,
}: ShortcutsControlProviderProps) {
  const value = useMemo<ShortcutsControlContextValue>(
    () => ({ openShortcuts, version }),
    [openShortcuts, version],
  );
  return (
    <ShortcutsControlContext.Provider value={value}>{children}</ShortcutsControlContext.Provider>
  );
}
