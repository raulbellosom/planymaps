"use client";

/**
 * BlueprintAuthCard
 * Form container with technical corner markers (blueprint style)
 */

import { forwardRef } from "react";

interface BlueprintAuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const BlueprintAuthCard = forwardRef<
  HTMLDivElement,
  BlueprintAuthCardProps
>(function BlueprintAuthCard({ children, className = "" }, ref) {
  return (
    <div
      ref={ref}
      className={`
        relative
        w-full max-w-md
        glass-heavy
        rounded-xl
        p-8
        shadow-2xl shadow-[var(--accent-500)]/5
        ${className}
      `}
    >
      {/* Corner Markers - Top Left */}
      <div className="absolute top-0 left-0 w-8 h-8" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-full border-l-2 border-t-2 border-[var(--accent-500)]/60 rounded-tl-xl" />
        <div className="absolute top-0 left-0 w-4 h-px bg-[var(--accent-500)]/60" />
        <div className="absolute top-0 left-0 h-4 w-px bg-[var(--accent-500)]/60" />
      </div>

      {/* Corner Markers - Top Right */}
      <div className="absolute top-0 right-0 w-8 h-8" aria-hidden="true">
        <div className="absolute top-0 right-0 w-full h-full border-r-2 border-t-2 border-[var(--accent-500)]/60 rounded-tr-xl" />
        <div className="absolute top-0 right-0 w-4 h-px bg-[var(--accent-500)]/60" />
        <div className="absolute top-0 right-0 h-4 w-px bg-[var(--accent-500)]/60" />
      </div>

      {/* Corner Markers - Bottom Left */}
      <div className="absolute bottom-0 left-0 w-8 h-8" aria-hidden="true">
        <div className="absolute bottom-0 left-0 w-full h-full border-l-2 border-b-2 border-[var(--accent-500)]/60 rounded-bl-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-px bg-[var(--accent-500)]/60" />
        <div className="absolute bottom-0 left-0 h-4 w-px bg-[var(--accent-500)]/60" />
      </div>

      {/* Corner Markers - Bottom Right */}
      <div className="absolute bottom-0 right-0 w-8 h-8" aria-hidden="true">
        <div className="absolute bottom-0 right-0 w-full h-full border-r-2 border-b-2 border-[var(--accent-500)]/60 rounded-br-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-px bg-[var(--accent-500)]/60" />
        <div className="absolute bottom-0 right-0 h-4 w-px bg-[var(--accent-500)]/60" />
      </div>

      {/* Inner dashed border for extra blueprint feel */}
      <div
        className="absolute inset-2 border border-dashed border-[var(--accent-500)]/20 rounded-lg pointer-events-none"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
});
