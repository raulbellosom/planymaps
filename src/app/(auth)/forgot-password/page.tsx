"use client";

/**
 * Forgot Password Page
 * Request password reset email
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  BlueprintAuthCard,
  BlueprintButton,
  BlueprintInput,
  BlueprintAlert,
} from "@/components/auth";

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { requestPasswordReset, error } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await requestPasswordReset(email);
      setIsSuccess(true);
    } catch {
      // Error is handled by useAuth
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Success State */}
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#E8F4FF] mb-2">
              Check your email
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              We&apos;ve sent password reset instructions to{" "}
              <span className="text-cyan-400">{email}</span>. Please check your
              inbox and follow the link to reset your password.
            </p>

            <div className="bg-[#1A2A40]/50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or wait a
                few minutes and try again.
              </p>
            </div>

            <Link href="/login">
              <BlueprintButton variant="secondary" size="lg" className="w-full">
                Back to sign in
              </BlueprintButton>
            </Link>
          </div>
        ) : (
          <>
            {/* Description */}
            <p className="text-sm text-gray-400 mb-6">
              Enter your email address and we&apos;ll send you instructions to
              reset your password.
            </p>

            {/* General Error */}
            {error && (
              <div className="mb-6">
                <BlueprintAlert variant="error" title="Request failed">
                  {error}
                </BlueprintAlert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <BlueprintInput
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
                required
                placeholder="you@example.com"
              />

              {/* Submit Button */}
              <BlueprintButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                loadingText="Sending..."
                className="w-full"
              >
                Send reset instructions
              </BlueprintButton>
            </form>
          </>
        )}

        {/* Divider */}
        {!isSuccess && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A4A6F]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#122033]/90 text-gray-400">
                Remember your password?
              </span>
            </div>
          </div>
        )}

        {/* Sign In Link */}
        {!isSuccess && (
          <Link href="/login">
            <BlueprintButton variant="ghost" size="lg" className="w-full">
              Back to sign in
            </BlueprintButton>
          </Link>
        )}
      </BlueprintAuthCard>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        Blueprint Edition v1.0.0
      </div>
    </div>
  );
}
