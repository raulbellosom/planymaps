"use client";

/**
 * Login Page
 * Email/password authentication with blueprint styling
 */

import { useState, useEffect, FormEvent } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  BlueprintAuthCard,
  BlueprintButton,
  BlueprintInput,
  BlueprintPasswordInput,
  BlueprintAlert,
} from "@/components/auth";
import { LogoSvg } from "@/components/ui/logo-svg";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get success messages from URL
  const registered = searchParams.get("registered");
  const verified = searchParams.get("verified");
  const reset = searchParams.get("reset");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/workspace");
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
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
      await login(email, password);
      // Redirect happens in useEffect
    } catch {
      // Error is handled by useAuth
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500 border-t-transparent"
          style={{ animationDuration: "1s" }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12">
            <LogoSvg className="w-full h-full" alt="Planymaps" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">
          Planymaps
        </h1>
        <p className="mt-3 text-gray-400">Sign in to your account</p>
      </div>

      <BlueprintAuthCard>
        {/* Success Messages */}
        {registered && (
          <div className="mb-6">
            <BlueprintAlert variant="success" title="Account created!">
              Please check your email to verify your account before signing in.
            </BlueprintAlert>
          </div>
        )}

        {verified && (
          <div className="mb-6">
            <BlueprintAlert variant="success" title="Email verified!">
              Your email has been verified. You can now sign in.
            </BlueprintAlert>
          </div>
        )}

        {reset && (
          <div className="mb-6">
            <BlueprintAlert variant="success" title="Password reset!">
              Your password has been reset. Please sign in with your new
              password.
            </BlueprintAlert>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-6">
            <BlueprintAlert variant="error" title="Login failed">
              {errors.general}
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
            leftIcon={<Mail className="w-5 h-5" />}
          />

          {/* Password Input */}
          <BlueprintPasswordInput
            id="password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <BlueprintButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Signing in..."
            className="w-full"
          >
            Sign in
          </BlueprintButton>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A4A6F]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#122033]/90 text-gray-400">
              New to Planymaps?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <Link href="/register">
          <BlueprintButton
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Create an account
          </BlueprintButton>
        </Link>
      </BlueprintAuthCard>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        Blueprint Edition v1.0.0
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
