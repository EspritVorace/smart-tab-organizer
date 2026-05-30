import React, { createContext, useContext, useMemo } from 'react';

export interface ShortcutsControlContextValue {
  openShortcuts: () => void;
}

const defaultValue: ShortcutsControlContextValue = {
  openShortcuts: () => undefined,
};

const ShortcutsControlContext = createContext<ShortcutsControlContextValue>(defaultValue);

export function useShortcutsControl(): ShortcutsControlContextValue {
  return useContext(ShortcutsControlContext);
}

interface ShortcutsControlProviderProps {
  openShortcuts: () => void;
  children: React.ReactNode;
}

export function ShortcutsControlProvider({
  openShortcuts,
  children,
}: ShortcutsControlProviderProps) {
  const value = useMemo<ShortcutsControlContextValue>(
    () => ({ openShortcuts }),
    [openShortcuts],
  );
  return (
    <ShortcutsControlContext.Provider value={value}>{children}</ShortcutsControlContext.Provider>
  );
}
