"use client";

/**
 * BlueprintAlert
 * Alert component for success, error, warning, and info messages
 */

import { forwardRef } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface BlueprintAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: string; title: string; text: string }
> = {
  success: {
    container: "bg-green-500/10 border-green-500/50 text-green-400",
    icon: "#00FF94",
    title: "text-green-400",
    text: "text-green-300/80",
  },
  error: {
    container: "bg-red-500/10 border-red-500/50 text-red-400",
    icon: "#FF4757",
    title: "text-red-400",
    text: "text-red-300/80",
  },
  warning: {
    container: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",
    icon: "#FFB800",
    title: "text-yellow-400",
    text: "text-yellow-300/80",
  },
  info: {
    container: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400",
    icon: "#00D4FF",
    title: "text-cyan-400",
    text: "text-cyan-300/80",
  },
};

const icons: Record<AlertVariant, React.ReactNode> = {
  success: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export const BlueprintAlert = forwardRef<HTMLDivElement, BlueprintAlertProps>(
  function BlueprintAlert(
    { variant = "info", title, children, className = "", onClose },
    ref,
  ) {
    const styles = variantStyles[variant];

    return (
      <div
        ref={ref}
        role="alert"
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={`
          relative
          p-4 rounded-lg border
          ${styles.container}
          ${className}
        `}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <span className="flex-shrink-0" style={{ color: styles.icon }}>
            {icons[variant]}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={`text-sm font-medium mb-1 ${styles.title}`}>
                {title}
              </h3>
            )}
            <div className={`text-sm ${styles.text}`}>{children}</div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="
                flex-shrink-0
                w-6 h-6
                flex items-center justify-center
                rounded
                text-gray-400 hover:text-white
                hover:bg-white/10
                focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                transition-colors duration-150
              "
              aria-label="Dismiss"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  },
);
