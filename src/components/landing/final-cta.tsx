"use client";

/**
 * FinalCTA Section
 * Final conversion call-to-action before footer
 */

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      className="
        relative
        py-16 md:py-24
        bg-[var(--navy-800)]
        overflow-hidden
      "
    >
      {/* Background glow */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-b from-[var(--navy-800)] via-[var(--navy-900)] to-[var(--navy-900)]
          pointer-events-none
        "
      />
      <div
        className="
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[600px] h-[400px]
          bg-[var(--cyan-500)] rounded-full
          opacity-[0.08] blur-[120px]
          pointer-events-none
        "
      />

      <div className="relative max-w-[var(--max-width)] mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <div
          className="
            inline-flex items-center gap-2 px-3 py-1.5
            glass-panel rounded-full text-sm text-[var(--accent-300)]
            mb-6
          "
        >
          <Sparkles className="w-4 h-4" />
          No credit card required
        </div>

        {/* Headline */}
        <h2
          className="
            text-3xl md:text-4xl lg:text-5xl font-bold
            text-[var(--gray-50)]
            mb-6
            tracking-tight
          "
        >
          Ready to transform how your team{" "}
          <span className="gradient-text">collaborates?</span>
        </h2>

        {/* Subline */}
        <p
          className="
            text-lg md:text-xl text-[var(--gray-400)]
            max-w-2xl mx-auto
            mb-10
          "
        >
          Join 500+ operations teams already using Planymaps. Get started in
          minutes, not days.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="
              group inline-flex items-center justify-center gap-2
              px-8 py-4 text-lg font-semibold
              bg-gradient-to-r from-[var(--cyan-500)] to-[var(--accent-500)]
              text-white rounded-xl
              shadow-lg shadow-[var(--accent-500)]/25
              hover:shadow-xl hover:shadow-[var(--accent-500)]/30 hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--cyan-500)] focus:ring-offset-2 focus:ring-offset-[var(--navy-900)]
            "
          >
            Start for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/demo"
            className="
              inline-flex items-center justify-center gap-2
              px-8 py-4 text-lg font-medium
              glass-panel text-[var(--gray-200)]
              rounded-xl
              hover:glass-border hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--cyan-500)] focus:ring-offset-2 focus:ring-offset-[var(--navy-900)]
            "
          >
            Schedule a Demo
          </Link>
        </div>

        {/* Trust badges */}
        <div
          className="
            mt-10 pt-10
            border-t border-[var(--navy-700)]
          "
        >
          <p className="text-sm text-[var(--gray-500)] mb-4">
            Trusted by operations teams at
          </p>
          <div
            className="
              flex flex-wrap justify-center gap-8 md:gap-12
              opacity-60
            "
          >
            {[
              "Pacific Southwest Airlines",
              "Denver International",
              "Houston Airport",
              "Seattle-Tacoma",
              "SkyTeam Cargo",
            ].map((company) => (
              <span
                key={company}
                className="text-sm font-medium text-[var(--gray-400)]"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
