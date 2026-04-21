"use client";

/**
 * Auth Layout
 * Blueprint background for all authentication pages
 * No navbar - auth pages are standalone
 */

import { BlueprintBackground } from "@/components/auth/blueprint-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BlueprintBackground showAnnotations={true}>
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        {children}
      </div>
    </BlueprintBackground>
  );
}
