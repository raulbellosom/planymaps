"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import React from "react";

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  shortcut,
  side = "right",
  align = "center",
  sideOffset = 8,
  alignOffset = 0,
  disabled = false,
}: TooltipProps) {
  if (disabled || !content) {
    return children;
  }

  const tooltipContent = (
    <RadixTooltip.Content
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className="z-50 overflow-hidden rounded-md bg-slate-900 px-3 py-1.5 text-xs text-slate-100 shadow-lg animate-scale-in"
    >
      <div className="flex items-center gap-2">
        <span>{content}</span>
        {shortcut && (
          <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">
            {shortcut}
          </span>
        )}
      </div>
      <RadixTooltip.Arrow className="text-slate-900" />
    </RadixTooltip.Content>
  );

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>{tooltipContent}</RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export function TooltipSimple({
  children,
  content,
  shortcut,
  disabled = false,
}: Omit<TooltipProps, "side" | "align" | "sideOffset" | "alignOffset">) {
  return (
    <Tooltip
      children={children}
      content={content}
      shortcut={shortcut}
      disabled={disabled}
    />
  );
}
