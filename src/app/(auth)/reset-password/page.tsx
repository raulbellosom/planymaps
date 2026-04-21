"use client";

/**
 * Reset Password Page
 * Set new password with token validation
 */

import { useState, Suspense, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  BlueprintAuthCard,
  BlueprintButton,
  BlueprintPasswordInput,
  BlueprintStrengthMeter,
  BlueprintAlert,
} from "@/components/auth";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain a number";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must contain a special character";
  }
  return null;
}

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const { resetPassword, error } = useAuth();
  const searchParams = useSearchParams();

  // Get token parameters from URL
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  // Compute validity directly instead of using useEffect
  const isTokenValid = userId && secret ? true : false;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userId || !secret) {
      setErrors({
        general: "Invalid reset token. Please request a new password reset.",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await resetPassword(userId, secret, password);
      // Redirect happens in useAuth
    } catch {
      // Error is handled by useAuth
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value.length > 0) {
      setShowPasswordStrength(true);
    } else {
      setShowPasswordStrength(false);
    }
  };

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">
            Planymaps
          </h1>
          <p className="mt-3 text-gray-400">Reset your password</p>
        </div>

        <BlueprintAuthCard>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#E8F4FF] mb-2">
              Invalid Reset Link
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>

            <Link href="/forgot-password">
              <BlueprintButton variant="primary" size="lg" className="w-full">
                Request new reset link
              </BlueprintButton>
            </Link>
          </div>
        </BlueprintAuthCard>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Blueprint Edition v1.0.0
        </div>
      </div>
    );
  }

  // Valid token - show password reset form
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">
          Planymaps
        </h1>
        <p className="mt-3 text-gray-400">Set new password</p>
      </div>

      <BlueprintAuthCard>
        {/* Description */}
        <p className="text-sm text-gray-400 mb-6">
          Enter your new password below. Make sure it meets the requirements.
        </p>

        {/* General Error */}
        {errors.general && (
          <div className="mb-6">
            <BlueprintAlert variant="error" title="Reset failed">
              {errors.general}
            </BlueprintAlert>
          </div>
        )}

        {/* Service Error */}
        {error && !errors.general && (
          <div className="mb-6">
            <BlueprintAlert variant="error" title="Reset failed">
              {error}
            </BlueprintAlert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <BlueprintPasswordInput
            id="password"
            name="password"
            label="New password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
            autoComplete="new-password"
            required
            placeholder="Create a strong password"
          />

          {/* Password Strength Meter */}
          {showPasswordStrength && (
            <div className="mt-4">
              <BlueprintStrengthMeter password={password} />
            </div>
          )}

          {/* Confirm Password Input */}
          <BlueprintPasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
            placeholder="Confirm your new password"
          />

          {/* Submit Button */}
          <BlueprintButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Resetting..."
            className="w-full"
          >
            Reset password
          </BlueprintButton>
        </form>
      </BlueprintAuthCard>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        Blueprint Edition v1.0.0
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500 border-t-transparent"
            style={{ animationDuration: "1s" }}
          />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
