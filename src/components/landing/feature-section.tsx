"use client";

/**
 * FeatureSection Component
 * Section showcasing key product features with glassmorphism styling
 */

import {
  Users,
  Maximize2,
  Share2,
  Layers,
  Map,
  Smartphone,
} from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Work together with your team simultaneously. See cursors, edits, and comments appear instantly as your team makes changes.",
    href: "#",
  },
  {
    icon: Maximize2,
    title: "Infinite Canvas Space",
    description:
      "Never run out of room. Zoom in for detailed annotations or zoom out to see the big picture—all on an unlimited workspace.",
    href: "#",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description:
      "Share boards with a single link. Control who can view, comment, or edit. Revoke access anytime with one click.",
    href: "#",
  },
  {
    icon: Layers,
    title: "Layer Management",
    description:
      "Organize content into logical layers. Lock, hide, or reorder layers to keep your board structured and manageable.",
    href: "#",
  },
  {
    icon: Map,
    title: "Map Integration",
    description:
      "Switch to map-aware mode for geo-referenced boards. Attach coordinates to pins and overlay data on real-world locations.",
    href: "#",
  },
  {
    icon: Smartphone,
    title: "Cross-Platform Support",
    description:
      "Full-featured experience on desktop, tablet, and mobile. Touch gestures, offline access, and responsive layouts everywhere.",
    href: "#",
  },
];

export function FeatureSection() {
  return (
    <section
      id="features"
      className="
        relative
        py-16 md:py-24
        bg-[var(--navy-900)]
      "
    >
      {/* Subtle top gradient border */}
      <div
        className="
          absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-white/10 to-transparent
        "
      />

      <div className="max-w-[var(--max-width)] mx-auto px-4 md:px-6">
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
            Everything you need to{" "}
            <span className="gradient-text">collaborate visually</span>
          </h2>
          <p
            className="
              text-lg text-white/60
              max-w-2xl mx-auto
            "
          >
            From quick annotations to complex operational boards, Planymaps
            provides all the tools your team needs to work together effectively.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              href={feature.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
