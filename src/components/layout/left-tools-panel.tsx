"use client";

import { usePanels } from "@/contexts/panel-context";
import { useUIStore } from "@/stores/ui-store";
import type { ToolType } from "@/stores/ui-store";
import { TOOL_SHORTCUTS } from "@/config/keyboard-shortcuts";
import {
  ArrowUpRight,
  Circle,
  Hand,
  Image as ImageIcon,
  Minus,
  MapPin,
  MousePointer2,
  Plus,
  Square,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import { TooltipSimple } from "@/components/ui/tooltip";

const tools: { id: ToolType; name: string; icon: LucideIcon }[] = [
  { id: "select", name: "Select", icon: MousePointer2 },
  { id: "rectangle", name: "Rectangle", icon: Square },
  { id: "ellipse", name: "Ellipse", icon: Circle },
  { id: "line", name: "Line", icon: Minus },
  { id: "arrow", name: "Arrow", icon: ArrowUpRight },
  { id: "text", name: "Text", icon: Type },
  {
    id: "image",
    name: "Image",
    icon: ImageIcon,
  },
  { id: "pin", name: "Pin", icon: MapPin },
  { id: "hand", name: "Pan", icon: Hand },
];

export function LeftToolsPanel() {
  const { panels, togglePanel } = usePanels();
  const activeTool = useUIStore((state) => state.activeTool);
  const setActiveTool = useUIStore((state) => state.setActiveTool);

  const handleToolSelect = (toolId: ToolType) => {
    setActiveTool(toolId);
    // Close mobile panel after selecting a tool
    if (window.innerWidth < 768) {
      togglePanel("leftPanel");
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col glass-panel border-r border-white/10
          transition-all duration-200 ease-in-out
          ${panels.leftPanel ? "w-16" : "w-0 overflow-hidden"}
        `}
      >
        <div className="flex-1 flex flex-col items-center py-4 gap-2">
          {tools.map((tool) => {
            const ToolIcon = tool.icon;
            const shortcut = TOOL_SHORTCUTS[tool.id];
            return (
              <TooltipSimple
                key={tool.id}
                content={tool.name}
                shortcut={shortcut}
              >
                <button
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-lg
                    touch-manipulation transition-all duration-150
                    ${
                      activeTool === tool.id
                        ? "bg-(--accent-500)/20 text-(--accent-400) shadow-sm"
                        : "text-(--gray-400) hover:text-white hover:bg-white/10 active:bg-white/15"
                    }
                  `}
                  aria-label={tool.name}
                  aria-pressed={activeTool === tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                >
                  <ToolIcon className="w-6 h-6" />
                </button>
              </TooltipSimple>
            );
          })}
        </div>
      </aside>

      {/* Mobile: floating action button to toggle tools */}
      <button
        onClick={() => togglePanel("leftPanel")}
        className="md:hidden fixed bottom-4 left-4 z-20 w-14 h-14 glass-heavy text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation hover:scale-105 active:scale-95 transition-transform"
        aria-label="Toggle tools"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile tools overlay */}
      {panels.leftPanel && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => togglePanel("leftPanel")}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 glass-heavy shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="font-semibold text-white">Tools</span>
              <button
                onClick={() => togglePanel("leftPanel")}
                className="p-2 rounded-lg hover:bg-white/10 text-(--gray-400) hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
              {tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    className={`
                      w-full h-14 flex items-center gap-3 px-4 rounded-lg
                      touch-manipulation transition-all duration-150 min-h-12
                      ${
                        activeTool === tool.id
                          ? "bg-(--accent-500)/20 text-(--accent-400)"
                          : "text-(--gray-300) hover:bg-white/10 hover:text-white active:bg-white/15"
                      }
                    `}
                    onClick={() => handleToolSelect(tool.id)}
                  >
                    <ToolIcon className="w-6 h-6" />
                    <span>{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
