"use client";

/**
 * BlueprintToaster
 * Toast notification provider with blueprint styling
 */

import { Toaster as SonnerToaster } from "sonner";

export function BlueprintToaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: `
            flex items-center gap-3
            w-full max-w-md
            px-4 py-3
            rounded-lg border
            shadow-lg
            transition-all duration-300
          `,
          title: "text-sm font-medium",
          description: "text-sm opacity-80",
          success: `
            bg-green-500/10 border-green-500/50 text-green-400
          `,
          error: `
            bg-red-500/10 border-red-500/50 text-red-400
          `,
          warning: `
            bg-yellow-500/10 border-yellow-500/50 text-yellow-400
          `,
          info: `
            bg-cyan-500/10 border-cyan-500/50 text-cyan-400
          `,
          loading: `
            bg-cyan-500/10 border-cyan-500/50 text-cyan-400
          `,
        },
      }}
      theme="dark"
      expand={false}
      richColors={false}
      visibleToasts={3}
    />
  );
}
