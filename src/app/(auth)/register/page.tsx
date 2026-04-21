"use client";

/**
 * Register Page
 * User registration with blueprint styling
 */

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  BlueprintAuthCard,
  BlueprintButton,
  BlueprintInput,
  BlueprintPasswordInput,
  BlueprintStrengthMeter,
  BlueprintAlert,
} from "@/components/auth";
import { LogoSvg } from "@/components/ui/logo-svg";

interface FormErrors {
  name?: string;
  email?: string;
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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const {
    register,
    isAuthenticated,
    isLoading: authLoading,
    error,
  } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/workspace");
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (optional but if provided, not empty)
    if (name && name.trim().length === 0) {
      newErrors.name = "Name cannot be empty if provided";
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

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

    setIsSubmitting(true);
    setErrors({});

    try {
      await register(email, password, name.trim() || undefined);
      // Redirect happens in useEffect
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
        <p className="mt-3 text-gray-400">Create your account</p>
      </div>

      <BlueprintAuthCard>
        {/* General Error */}
        {error && (
          <div className="mb-6">
            <BlueprintAlert variant="error" title="Registration failed">
              {error}
            </BlueprintAlert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <BlueprintInput
            id="name"
            name="name"
            type="text"
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
            placeholder="Your name"
          />

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

          {/* Password Input */}
          <BlueprintPasswordInput
            id="password"
            name="password"
            label="Password"
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
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
            placeholder="Confirm your password"
          />

          {/* Terms Notice */}
          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">
              Privacy Policy
            </Link>
          </p>

          {/* Submit Button */}
          <BlueprintButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Creating account..."
            className="w-full"
          >
            Create account
          </BlueprintButton>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A4A6F]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#122033]/90 text-gray-400">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Sign In Link */}
        <Link href="/login">
          <BlueprintButton
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Sign in
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
