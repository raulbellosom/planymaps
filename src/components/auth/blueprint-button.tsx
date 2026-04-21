"use client";

/**
 * BlueprintButton
 * Primary button with loading state and blueprint styling
 */

import { forwardRef } from "react";

interface BlueprintButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const BlueprintButton = forwardRef<
  HTMLButtonElement,
  BlueprintButtonProps
>(function BlueprintButton(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = "",
    ...props
  },
  ref,
) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A1628]
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-cyan-500 text-[#0A1628]
      hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25
      focus:ring-cyan-500
    `,
    secondary: `
      bg-[#1A2A40] text-[#E8F4FF] border-2 border-[#2A4A6F]
      hover:bg-[#2A4A6F] hover:border-cyan-500/50
      focus:ring-cyan-500
    `,
    ghost: `
      bg-transparent text-[#7BA3C4]
      hover:bg-[#1A2A40] hover:text-cyan-400
      focus:ring-cyan-500
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {!isLoading && leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}

      {/* Text */}
      <span>{isLoading && loadingText ? loadingText : children}</span>

      {/* Right Icon */}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});
