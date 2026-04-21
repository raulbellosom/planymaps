"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-[#0A1628] min-h-screen flex items-center justify-center">
        <div className="text-center px-6 max-w-md mx-auto">
          {/* Animated Error Icon */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-500/20 to-red-500/20 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-16 h-16 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>
            {/* Decorative rings */}
            <div
              className="absolute inset-0 w-32 h-32 mx-auto border border-cyan-500/30 rounded-full animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <div className="absolute inset-2 w-28 h-28 mx-auto border border-red-500/20 rounded-full" />
          </div>

          {/* Error Title */}
          <h1 className="text-4xl font-bold text-white mb-3">
            Oops! Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-400 mb-8 leading-relaxed">
            We encountered an unexpected error. This has been logged and our
            team will investigate.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-cyan-500/25"
            >
              Try Again
            </button>
            <a
              href="/workspace"
              className="px-6 py-3 bg-[#122033] border border-[#2A4A6F] text-white font-semibold rounded-lg hover:bg-[#1E3A5F] transition-all duration-200"
            >
              Go to Workspace
            </a>
          </div>

          {/* Error ID for support */}
          {error.digest && (
            <p className="mt-6 text-xs text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
