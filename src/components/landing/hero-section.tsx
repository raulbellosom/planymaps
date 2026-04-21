"use client";

/**
 * HeroSection Component
 * Main hero section with glassmorphism styling and accent colors
 */

import Link from "next/link";
import { ArrowRight, Play, Users, MapPin, Layers } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="
        relative min-h-screen
        flex items-center
        pt-[var(--header-height)]
        overflow-hidden
      "
    >
      {/* Background with depth */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-br from-[var(--navy-900)] via-[var(--navy-800)] to-[var(--navy-900)]
          pointer-events-none
        "
      />

      {/* Subtle dot grid pattern */}
      <div
        className="
          absolute inset-0 opacity-[0.05]
          dot-grid
          pointer-events-none
        "
      />

      {/* Decorative gradient orbs with new accent colors */}
      <div
        className="
          absolute top-1/4 left-1/4 w-[500px] h-[500px]
          bg-gradient-to-br from-[var(--accent-500)]/20 to-transparent rounded-full
          blur-[120px]
          pointer-events-none
          animate-[float_8s_ease-in-out_infinite]
        "
      />
      <div
        className="
          absolute bottom-1/4 right-1/4 w-[400px] h-[400px]
          bg-gradient-to-tr from-[var(--cyan-500)]/15 to-transparent rounded-full
          blur-[100px]
          pointer-events-none
          animate-[float_10s_ease-in-out_infinite_reverse]
        "
      />

      {/* Content */}
      <div className="relative max-w-[var(--max-width)] mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            {/* Glassmorphism badge */}
            <div
              className="
                inline-flex items-center gap-2 px-4 py-2
                glass-panel rounded-full
                text-sm text-white/80
                mb-6
                animate-[fadeInUp_600ms_ease-out]
              "
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-400)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[var(--cyan-400)] to-[var(--accent-400)]"></span>
              </span>
              Real-time collaboration is live
            </div>

            {/* Headline */}
            <h1
              className="
                text-4xl md:text-5xl lg:text-6xl font-bold
                text-white
                leading-[1.1]
                tracking-tight
                mb-6
                animate-[fadeInUp_600ms_ease-out_100ms_both]
              "
            >
              Visual collaboration{" "}
              <span className="gradient-text">for operations teams</span>
            </h1>

            {/* Subline */}
            <p
              className="
                text-lg md:text-xl text-white/60
                leading-relaxed
                max-w-xl mx-auto lg:mx-0
                mb-10
                animate-[fadeInUp_600ms_ease-out_200ms_both]
              "
            >
              Planymaps transforms how airport operations teams work together.
              Annotate layouts, place pins, and collaborate in real-time—all on
              an infinite canvas.
            </p>

            {/* CTAs with enhanced hover effects */}
            <div
              className="
                flex flex-col sm:flex-row gap-4
                justify-center lg:justify-start
                mb-10
                animate-[fadeInUp_600ms_ease-out_300ms_both]
              "
            >
              <Link
                href="/register"
                className="
                  group inline-flex items-center justify-center gap-2
                  px-6 py-3.5 text-base font-semibold
                  bg-gradient-to-r from-[var(--cyan-500)] to-[var(--accent-500)]
                  text-white
                  rounded-xl
                  shadow-lg shadow-[var(--accent-500)]/25
                  hover:shadow-xl hover:shadow-[var(--accent-500)]/30
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-400)] focus:ring-offset-2 focus:ring-offset-transparent
                "
              >
                Start for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/workspace"
                className="
                  group inline-flex items-center justify-center gap-2
                  px-6 py-3.5 text-base font-semibold
                  glass-panel text-white
                  rounded-xl
                  hover:glass-border
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-400)] focus:ring-offset-2 focus:ring-offset-transparent
                "
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </Link>
            </div>

            {/* Trust indicators with glass effect */}
            <div
              className="
                flex flex-col sm:flex-row items-center gap-6
                justify-center lg:justify-start
                animate-[fadeInUp_600ms_ease-out_400ms_both]
              "
            >
              {/* Avatar stack with gradient borders */}
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[
                    "bg-gradient-to-br from-[var(--cyan-400)] to-[var(--accent-500)]",
                    "bg-gradient-to-br from-[var(--success)] to-[var(--cyan-400)]",
                    "bg-gradient-to-br from-[var(--warning)] to-[var(--error)]",
                    "bg-gradient-to-br from-[var(--accent-400)] to-[var(--accent-600)]",
                    "bg-gradient-to-br from-[var(--error)] to-[var(--warning)]",
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`
                        w-9 h-9 rounded-full border-2 border-[var(--navy-800)]
                        ${gradient}
                        shadow-lg
                      `}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-white/60">
                <span className="font-semibold text-white">500+</span> teams
                collaborating right now
              </div>
            </div>
          </div>

          {/* Right: Canvas preview with glassmorphism */}
          <div
            className="
              relative
              animate-[fadeIn_800ms_ease-out_300ms_both]
            "
          >
            {/* Glassmorphism preview card */}
            <div
              className="
                relative
                glass-panel rounded-2xl
                shadow-2xl shadow-black/30
                overflow-hidden
                hover:glass-border
                transition-all duration-300
              "
            >
              {/* Window chrome with glass effect */}
              <div className="flex items-center gap-2 px-4 py-3 glass-navy border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--error)]/80" />
                  <div className="w-3 h-3 rounded-full bg-[var(--warning)]/80" />
                  <div className="w-3 h-3 rounded-full bg-[var(--success)]/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-white/60">
                    Airport Terminal A - Operations Board
                  </span>
                </div>
                <div className="w-16" />
              </div>

              {/* Canvas content */}
              <div className="relative aspect-[4/3] p-4">
                {/* Background grid */}
                <div
                  className="absolute inset-4 opacity-10"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Airport layout visualization */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Terminal outline */}
                  <rect
                    x="50"
                    y="60"
                    width="300"
                    height="180"
                    rx="8"
                    stroke="var(--cyan-400)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    fill="none"
                    opacity="0.4"
                  />

                  {/* Runway */}
                  <rect
                    x="80"
                    y="200"
                    width="240"
                    height="40"
                    rx="4"
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />

                  {/* Gates */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <rect
                      key={i}
                      x={70 + i * 55}
                      y="80"
                      width="40"
                      height="30"
                      rx="4"
                      fill="rgba(255,255,255,0.05)"
                      stroke="var(--cyan-400)"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Annotations/Pins with glow */}
                  <circle
                    cx="120"
                    cy="95"
                    r="8"
                    fill="var(--cyan-400)"
                    opacity="0.9"
                  />
                  <circle
                    cx="230"
                    cy="100"
                    r="8"
                    fill="var(--success)"
                    opacity="0.9"
                  />
                  <circle
                    cx="280"
                    cy="130"
                    r="8"
                    fill="var(--warning)"
                    opacity="0.9"
                  />
                  <circle
                    cx="170"
                    cy="140"
                    r="8"
                    fill="var(--error)"
                    opacity="0.9"
                  />

                  {/* Collaboration cursors */}
                  <g opacity="0.9">
                    <path
                      d="M200 150 L210 165 L205 165 L205 180 L195 180 L195 165 L190 165 Z"
                      fill="var(--accent-400)"
                    />
                    <rect
                      x="195"
                      y="130"
                      width="40"
                      height="16"
                      rx="3"
                      fill="var(--accent-400)"
                    />
                    <text
                      x="200"
                      y="142"
                      fontSize="9"
                      fill="white"
                      fontWeight="500"
                    >
                      Sarah
                    </text>
                  </g>

                  <g opacity="0.9">
                    <path
                      d="M300 200 L310 215 L305 215 L305 230 L295 230 L295 215 L290 215 Z"
                      fill="var(--success)"
                    />
                    <rect
                      x="295"
                      y="180"
                      width="40"
                      height="16"
                      rx="3"
                      fill="var(--success)"
                    />
                    <text
                      x="300"
                      y="192"
                      fontSize="9"
                      fill="white"
                      fontWeight="500"
                    >
                      Mike
                    </text>
                  </g>
                </svg>

                {/* Floating glassmorphism info cards */}
                <div
                  className="
                    absolute top-4 right-4
                    flex items-center gap-2 px-3 py-2
                    glass-panel rounded-lg
                    text-sm text-white/90
                  "
                >
                  <Users className="w-4 h-4 text-[var(--accent-400)]" />
                  <span>3 collaborators</span>
                </div>

                <div
                  className="
                    absolute bottom-4 left-4
                    flex items-center gap-2 px-3 py-2
                    glass-panel rounded-lg
                    text-sm text-white/90
                  "
                >
                  <Layers className="w-4 h-4 text-[var(--cyan-400)]" />
                  <span>5 layers</span>
                </div>

                <div
                  className="
                    absolute bottom-4 right-4
                    flex items-center gap-2 px-3 py-2
                    glass-panel rounded-lg
                    text-sm text-white/90
                  "
                >
                  <MapPin className="w-4 h-4 text-[var(--warning)]" />
                  <span>12 pins</span>
                </div>
              </div>
            </div>

            {/* Accent glow behind card */}
            <div
              className="
                absolute -inset-8
                bg-gradient-to-br from-[var(--accent-500)]/10 to-[var(--cyan-500)]/10
                rounded-3xl
                blur-2xl
                -z-10
              "
            />
          </div>
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div
        className="
          absolute bottom-0 left-0 right-0 h-32
          bg-gradient-to-t from-[var(--navy-900)] to-transparent
          pointer-events-none
        "
      />
    </section>
  );
}
