"use client";

/**
 * FeatureCard Component
 * Individual feature display with glassmorphism styling
 */

import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
}: FeatureCardProps) {
  const cardContent = (
    <div
      className="
        group relative
        glass-panel
        rounded-xl
        p-6
        hover:glass-border
        hover:-translate-y-1
        hover:shadow-xl hover:shadow-black/20
        transition-all duration-300
        focus-within:ring-2 focus-within:ring-[var(--accent-400)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--navy-900)]
      "
    >
      {/* Icon container with glass effect */}
      <div
        className="
          w-12 h-12 rounded-xl
          bg-gradient-to-br from-[var(--cyan-500)]/20 to-[var(--accent-500)]/20
          border border-[var(--cyan-500)]/30
          flex items-center justify-center
          mb-4
          group-hover:from-[var(--cyan-500)]/30 group-hover:to-[var(--accent-500)]/30
          group-hover:border-[var(--cyan-500)]/50
          transition-all duration-300
        "
      >
        <Icon className="w-6 h-6 text-[var(--accent-400)]" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>

      {/* Hover arrow indicator */}
      <div
        className="
          absolute top-6 right-6
          opacity-0 group-hover:opacity-100
          transform translate-x-2 group-hover:translate-x-0
          transition-all duration-300
        "
      >
        <svg
          className="w-5 h-5 text-[var(--accent-400)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </div>

      {/* Bottom gradient border on hover */}
      <div
        className="
          absolute bottom-0 left-0 right-0 h-0.5
          bg-gradient-to-r from-transparent via-[var(--accent-400)] to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        "
      />
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-900)] rounded-xl"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
