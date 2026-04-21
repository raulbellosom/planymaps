"use client";

/**
 * BlueprintPasswordInput
 * Password input with visibility toggle and standard label
 */

import { useState, forwardRef } from "react";

interface BlueprintPasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const BlueprintPasswordInput = forwardRef<
  HTMLInputElement,
  BlueprintPasswordInputProps
>(function BlueprintPasswordInput(
  {
    id,
    name,
    label,
    value,
    onChange,
    error,
    autoComplete = "current-password",
    required = false,
    placeholder,
    className = "",
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Standard Label - Always Visible */}
      <label
        htmlFor={id}
        className={`
          block text-sm font-medium mb-2
          ${error ? "text-red-400" : "text-gray-300"}
        `}
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          className={`
            w-full px-4 py-3 pr-12
            bg-[#0D1F33]
            border-2 rounded-lg
            text-[#E8F4FF] placeholder-gray-500
            outline-none
            transition-all duration-200
            ${
              error
                ? "border-red-500 focus:border-red-400"
                : "border-[#2A4A6F] focus:border-cyan-500 focus:border-dashed"
            }
          `}
        />

        {/* Visibility Toggle */}
        <button
          type="button"
          onClick={toggleVisibility}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            w-8 h-8
            flex items-center justify-center
            rounded-md
            text-gray-400 hover:text-cyan-400
            hover:bg-[#1A2A40]
            focus:outline-none focus:ring-2 focus:ring-cyan-500/50
            transition-colors duration-150
          "
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? (
            // Eye Off Icon
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
                strokeWidth={1.5}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            // Eye Icon
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
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 text-sm text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});
