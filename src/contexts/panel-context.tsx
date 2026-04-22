"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PanelState {
  leftPanel: boolean;
  rightPanel: boolean;
  layerPanel: boolean;
  configurationPanel: boolean;
}

interface PanelContextValue {
  panels: PanelState;
  togglePanel: (panel: keyof PanelState) => void;
  closePanel: (panel: keyof PanelState) => void;
  openPanel: (panel: keyof PanelState) => void;
}

const PanelContext = createContext<PanelContextValue | undefined>(undefined);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<PanelState>({
    leftPanel: true, // Tools panel - open by default on desktop
    rightPanel: false, // Inspector - closed by default
    layerPanel: true, // Layer panel - open by default on desktop
    configurationPanel: false, // Configuration panel - closed by default
  });

  const togglePanel = (panel: keyof PanelState) => {
    setPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const closePanel = (panel: keyof PanelState) => {
    setPanels((prev) => ({ ...prev, [panel]: false }));
  };

  const openPanel = (panel: keyof PanelState) => {
    setPanels((prev) => ({ ...prev, [panel]: true }));
  };

  return (
    <PanelContext.Provider
      value={{ panels, togglePanel, closePanel, openPanel }}
    >
      {children}
    </PanelContext.Provider>
  );
}

export function usePanels() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("usePanels must be used within a PanelProvider");
  }
  return context;
}
