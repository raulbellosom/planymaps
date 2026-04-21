"use client";

/**
 * Verify Page
 * Email verification handler with blueprint styling
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  BlueprintAuthCard,
  BlueprintButton,
  BlueprintAlert,
} from "@/components/auth";

type VerifyStatus = "idle" | "verifying" | "success" | "error" | "expired";

function VerifyContent() {
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { verifyEmail, resendVerification } = useAuth();
  const searchParams = useSearchParams();

  // Get secret from URL
  const secret = searchParams.get("secret");
  const userId = searchParams.get("userId");

  const handleVerify = useCallback(async () => {
    if (!secret || !userId) {
      setStatus("error");
      setErrorMessage(
        "Verification link is invalid. Please request a new one.",
      );
      return;
    }

    setStatus("verifying");
    setErrorMessage(null);

    try {
      await verifyEmail(userId, secret);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";

      // Check for expired token
      if (message.includes("expired") || message.includes("invalid")) {
        setStatus("expired");
        setErrorMessage(
          "This verification link has expired. Please request a new one.",
        );
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    }
  }, [secret, userId, verifyEmail]);

  useEffect(() => {
    if (secret && userId) {
      // Defer handleVerify to avoid setState in effect lint error
      const frameId = requestAnimationFrame(() => {
        handleVerify();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [secret, userId, handleVerify]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      await resendVerification();
      setStatus("idle");
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend verification";
      setErrorMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">
          Planymaps
        </h1>
        <p className="mt-3 text-gray-400">Email Verification</p>
      </div>

      <BlueprintAuthCard>
        {/* Loading State */}
        {status === "verifying" && (
          <div className="text-center py-8">
            <div
              className="animate-spin rounded-full h-16 w-16 border-3 border-cyan-500 border-t-transparent mx-auto mb-6"
              style={{ animationDuration: "1s" }}
            />
            <h3 className="text-lg font-medium text-[#E8F4FF] mb-2">
              Verifying your email...
            </h3>
            <p className="text-sm text-gray-400">
              Please wait while we confirm your verification link.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center py-8">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#E8F4FF] mb-2">
              Email Verified!
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Your email has been successfully verified. You can now sign in to
              your account.
            </p>
            <Link href="/login">
              <BlueprintButton variant="primary" size="lg" className="w-full">
                Sign in
              </BlueprintButton>
            </Link>
          </div>
        )}

        {/* Error States */}
        {(status === "error" || status === "expired") && (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#E8F4FF] mb-2">
              {status === "expired" ? "Link Expired" : "Verification Failed"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {errorMessage || "Please request a new verification link."}
            </p>

            {errorMessage && (
              <div className="mb-6">
                <BlueprintAlert variant="error">{errorMessage}</BlueprintAlert>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className={`
                  w-full px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    resendCooldown > 0 || isResending
                      ? "bg-[#1A2A40] text-gray-500 cursor-not-allowed"
                      : "bg-cyan-500 text-[#0A1628] hover:bg-cyan-400"
                  }
                `}
              >
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend verification email"}
              </button>

              <Link href="/login">
                <BlueprintButton variant="ghost" size="md" className="w-full">
                  Back to sign in
                </BlueprintButton>
              </Link>
            </div>
          </div>
        )}

        {/* Idle State - No token in URL */}
        {status === "idle" && !secret && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-cyan-400"
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
              Verify your email
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Check your email for a verification link. If you didn&apos;t
              receive one, you can request a new one.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className={`
                  w-full px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    resendCooldown > 0 || isResending
                      ? "bg-[#1A2A40] text-gray-500 cursor-not-allowed"
                      : "bg-cyan-500 text-[#0A1628] hover:bg-cyan-400"
                  }
                `}
              >
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend verification email"}
              </button>

              <Link href="/login">
                <BlueprintButton variant="ghost" size="md" className="w-full">
                  Back to sign in
                </BlueprintButton>
              </Link>
            </div>
          </div>
        )}
      </BlueprintAuthCard>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        Blueprint Edition v1.0.0
      </div>
    </div>
  );
}

export default function VerifyPage() {
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
      <VerifyContent />
    </Suspense>
  );
}
