"use client";

/**
 * PricingSection Component
 * Pricing tiers with glassmorphism styling
 */

import { Check, Zap } from "lucide-react";
import Link from "next/link";

interface PricingTier {
  name: string;
  price: string | null;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: null,
    description: "Perfect for small teams getting started",
    features: [
      "Up to 3 team members",
      "10 boards",
      "1GB storage",
      "Basic sharing",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For growing teams with advanced needs",
    features: [
      "Unlimited team members",
      "Unlimited boards",
      "50GB storage",
      "Advanced sharing & permissions",
      "Layer management",
      "Priority support",
      "API access",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: null,
    description: "For large organizations with custom requirements",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "SSO/SAML authentication",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="
        relative
        py-16 md:py-24
        bg-[var(--navy-900)]
      "
    >
      {/* Top border */}
      <div
        className="
          absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-white/10 to-transparent
        "
      />

      <div className="relative max-w-[var(--max-width)] mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="
              text-3xl md:text-4xl lg:text-5xl font-bold
              text-white
              mb-4
              tracking-tight
            "
          >
            Simple, transparent pricing
          </h2>
          <p
            className="
              text-lg text-white/60
              max-w-2xl mx-auto
            "
          >
            Start free, upgrade when you need more power. No hidden fees, cancel
            anytime.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`
                relative
                rounded-2xl
                p-6 lg:p-8
                transition-all duration-300
                ${
                  tier.highlighted
                    ? "glass-border shadow-xl shadow-[var(--accent-500)]/10"
                    : "glass-panel hover:glass-border"
                }
              `}
            >
              {/* Highlighted badge */}
              {tier.highlighted && (
                <div
                  className="
                    absolute -top-3 left-1/2 -translate-x-1/2
                    inline-flex items-center gap-1.5
                    px-4 py-1.5
                    bg-gradient-to-r from-[var(--cyan-500)] to-[var(--accent-500)]
                    text-white text-xs font-bold rounded-full
                    shadow-lg shadow-[var(--accent-500)]/30
                  "
                >
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              {/* Tier name */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                {tier.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-white/60">{tier.period}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-semibold text-white">
                    Custom
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-white/60 mb-6">{tier.description}</p>

              {/* CTA button */}
              <Link
                href={tier.name === "Enterprise" ? "/contact" : "/register"}
                className={`
                  block w-full text-center
                  px-4 py-3 rounded-xl
                  font-semibold
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-900)]
                  ${
                    tier.highlighted
                      ? "bg-gradient-to-r from-[var(--cyan-500)] to-[var(--accent-500)] text-white shadow-lg shadow-[var(--accent-500)]/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      : "glass-panel text-white hover:glass-border hover:scale-[1.02] active:scale-[0.98]"
                  }
                `}
              >
                {tier.cta}
              </Link>

              {/* Divider */}
              <div
                className="
                  my-6 h-px
                  bg-gradient-to-r from-transparent via-white/10 to-transparent
                "
              />

              {/* Features list */}
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-white/80"
                  >
                    <div className="w-5 h-5 rounded-full bg-[var(--accent-400)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[var(--accent-400)]" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enterprise note */}
        <p className="text-center text-sm text-white/40 mt-8">
          All plans include 99.9% uptime SLA, SOC 2 compliance, and GDPR
          compliance. Enterprise pricing includes volume discounts.
        </p>
      </div>
    </section>
  );
}
