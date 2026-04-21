"use client";

/**
 * BlueprintStrengthMeter
 * Animated password strength indicator with requirements checklist
 */

import { useMemo } from "react";

interface Requirement {
  met: boolean;
  text: string;
}

interface BlueprintStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  requirements: Requirement[];
} {
  const requirements: Requirement[] = [
    { met: password.length >= 8, text: "8+ characters" },
    { met: /[a-z]/.test(password), text: "lowercase letter" },
    { met: /[A-Z]/.test(password), text: "uppercase letter" },
    { met: /\d/.test(password), text: "number" },
    { met: /[^a-zA-Z0-9]/.test(password), text: "special character" },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  // Score 0-4 based on requirements met
  let score = 0;
  if (metCount >= 1) score = 1;
  if (metCount >= 2) score = 2;
  if (metCount >= 3) score = 3;
  if (metCount >= 4) score = 4;

  const levels = [
    { label: "Very weak", color: "#FF4757", bgColor: "bg-red-500" },
    { label: "Weak", color: "#FF7F50", bgColor: "bg-orange-500" },
    { label: "Fair", color: "#FFB800", bgColor: "bg-yellow-500" },
    { label: "Good", color: "#00D4FF", bgColor: "bg-cyan-500" },
    { label: "Strong", color: "#00FF94", bgColor: "bg-green-500" },
  ];

  return {
    score,
    ...levels[score],
    requirements,
  };
}

export function BlueprintStrengthMeter({
  password,
  showRequirements = true,
}: BlueprintStrengthMeterProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2" role="group" aria-label="Password strength">
      {/* Strength Bar */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`
              h-1.5 flex-1 rounded-full
              transition-all duration-300 ease-out
              ${index <= strength.score ? strength.bgColor : "bg-[#2A4A6F]"}
            `}
            style={{
              transitionDelay: `${index * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: strength.color }}>
          {strength.label}
        </span>
        <span className="text-xs text-gray-500">{strength.score + 1}/5</span>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <ul className="space-y-1 pt-1" aria-label="Password requirements">
          {strength.requirements.map((req, index) => (
            <li
              key={index}
              className={`
                flex items-center gap-2 text-xs
                transition-colors duration-200
                ${req.met ? "text-green-400" : "text-gray-500"}
              `}
            >
              {/* Check Icon */}
              <span className="w-3.5 h-3.5 flex-shrink-0">
                {req.met ? (
                  <svg
                    className="w-full h-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-full h-full opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                )}
              </span>
              <span>{req.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
