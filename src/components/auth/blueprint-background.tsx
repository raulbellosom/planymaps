"use client";

/**
 * BlueprintBackground
 * Animated blueprint-style grid background for auth pages
 */

import { useState, useCallback, useSyncExternalStore } from "react";

interface BlueprintBackgroundProps {
  children: React.ReactNode;
  showAnnotations?: boolean;
}

// Subscribe to reduced motion preference without triggering cascading renders
function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotionSnapshot() {
  return false; // Default to false on server
}

export function BlueprintBackground({
  children,
  showAnnotations = true,
}: BlueprintBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isReducedMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      setMousePosition({ x, y });
    },
    [isReducedMotion],
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-[#0A1628]"
      onMouseMove={handleMouseMove}
    >
      {/* Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1E3A5F 1px, transparent 1px),
            linear-gradient(to bottom, #1E3A5F 1px, transparent 1px),
            linear-gradient(to right, #0D2137 1px, transparent 1px),
            linear-gradient(to bottom, #0D2137 1px, transparent 1px)
          `,
          backgroundSize: `
            100px 100px,
            100px 100px,
            20px 20px,
            20px 20px
          `,
          backgroundPosition: `
            ${mousePosition.x}px ${mousePosition.y}px,
            ${mousePosition.x}px ${mousePosition.y}px,
            ${mousePosition.x * 2}px ${mousePosition.y * 2}px,
            ${mousePosition.x * 2}px ${mousePosition.y * 2}px
          `,
          transition: isReducedMotion
            ? "none"
            : "background-position 0.1s ease-out",
        }}
      />

      {/* Animated Construction Lines */}
      {showAnnotations && !isReducedMotion && (
        <>
          <div
            className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
            style={{
              animation: "scanline 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
            style={{
              animation: "scanline 12s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"
            style={{
              animation: "scanlineV 10s ease-in-out infinite",
            }}
          />
          <div
            className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent"
            style={{
              animation: "scanlineV 15s ease-in-out infinite reverse",
            }}
          />
        </>
      )}

      {/* Corner Markers */}
      {showAnnotations && (
        <>
          {/* Top Left */}
          <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-cyan-500/40" />
          <div
            className="absolute top-8 left-8 w-4 h-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
          <div
            className="absolute top-8 left-8 h-4 w-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />

          {/* Top Right */}
          <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-cyan-500/40" />
          <div
            className="absolute top-8 right-8 w-4 h-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
          <div
            className="absolute top-8 right-8 h-4 w-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />

          {/* Bottom Left */}
          <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-cyan-500/40" />
          <div
            className="absolute bottom-8 left-8 w-4 h-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-8 left-8 h-4 w-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />

          {/* Bottom Right */}
          <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-cyan-500/40" />
          <div
            className="absolute bottom-8 right-8 w-4 h-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-8 right-8 h-4 w-px bg-cyan-500/40"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes scanline {
          0%,
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes scanlineV {
          0%,
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
