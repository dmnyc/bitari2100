import React, { ReactNode, createContext, useContext } from 'react';
import { AtariConsole } from '../atari/AtariConsole';

interface AppShellContextValue {
  safeAreasApplied: boolean;
}

const AppShellContext = createContext<AppShellContextValue>({ safeAreasApplied: true });

export const useAppShell = () => useContext(AppShellContext);

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell wraps the entire app in the AtariConsole frame (wood grain + CRT).
 */
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <AppShellContext.Provider value={{ safeAreasApplied: true }}>
      <AtariConsole boot>
        {children}
      </AtariConsole>
    </AppShellContext.Provider>
  );
};

export default AppShell;
