"use client";

/**
 * BlueprintInput
 * Text input with standard label and blueprint styling
 */

import { forwardRef } from "react";

interface BlueprintInputProps {
  id: string;
  name: string;
  type?: "text" | "email" | "tel" | "url" | "password";
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const BlueprintInput = forwardRef<HTMLInputElement, BlueprintInputProps>(
  function BlueprintInput(
    {
      id,
      name,
      type = "text",
      label,
      value,
      onChange,
      error,
      autoComplete,
      required = false,
      placeholder,
      className = "",
      disabled = false,
      leftIcon,
      rightIcon,
    },
    ref,
  ) {
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

        {/* Input Container with Icons */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            className={`
              w-full px-4 py-3
              ${leftIcon ? "pl-11" : ""}
              ${rightIcon ? "pr-11" : ""}
              bg-[#0D1F33]
              border-2 rounded-lg
              text-[#E8F4FF] placeholder-gray-500
              outline-none
              transition-all duration-200
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${
                error
                  ? "border-red-500 focus:border-red-400"
                  : "border-[#2A4A6F] focus:border-cyan-500 focus:border-dashed"
              }
            `}
          />

          {/* Right Icon */}
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
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
  },
);
