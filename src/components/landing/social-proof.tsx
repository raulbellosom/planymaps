"use client";

/**
 * SocialProof Section
 * Testimonials and social proof with glassmorphism styling
 */

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarColor: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Planymaps transformed how our operations team coordinates terminal layouts. What used to take hours of email back-and-forth now happens in real-time.",
    author: "Sarah Chen",
    role: "Operations Director",
    company: "Pacific Southwest Airlines",
    avatarColor:
      "bg-gradient-to-br from-[var(--cyan-400)] to-[var(--accent-500)]",
  },
  {
    quote:
      "The layer management feature alone is worth it. We can separate safety annotations from operational notes, and each team sees exactly what they need.",
    author: "Marcus Thompson",
    role: "Field Operations Manager",
    company: "Denver International Airport",
    avatarColor: "bg-gradient-to-br from-[var(--success)] to-[var(--cyan-400)]",
  },
  {
    quote:
      "Real-time collaboration with our remote team was a game-changer during the terminal renovation project. Everyone stayed aligned without constant meetings.",
    author: "Elena Rodriguez",
    role: "Project Lead",
    company: "Houston Airport System",
    avatarColor: "bg-gradient-to-br from-[var(--warning)] to-[var(--error)]",
  },
  {
    quote:
      "The map integration lets us tie operational data to real-world locations. Our ground crews can now see exactly where maintenance issues are flagged.",
    author: "James Park",
    role: "Technology Officer",
    company: "Seattle-Tacoma International",
    avatarColor:
      "bg-gradient-to-br from-[var(--accent-400)] to-[var(--accent-600)]",
  },
];

export function SocialProof() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll carousel
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Scroll to current card
  useEffect(() => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const cardWidth = scrollWidth / testimonials.length;
      scrollRef.current.scrollTo({
        left: cardWidth * currentIndex,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section
      className="
        relative
        py-16 md:py-24
        bg-[var(--navy-800)]
        overflow-hidden
      "
    >
      {/* Background decoration */}
      <div
        className="
          absolute inset-0
          dot-grid opacity-[0.03]
          pointer-events-none
        "
      />

      <div className="relative max-w-[var(--max-width)] mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2
            className="
              text-3xl md:text-4xl font-bold
              text-white
              mb-4
            "
          >
            Trusted by operations teams
          </h2>
          <p
            className="
              text-lg text-white/60
              max-w-2xl mx-auto
            "
          >
            See how airport operations teams use Planymaps to improve
            collaboration and reduce coordination time.
          </p>
        </div>

        {/* Stats row with glass effect */}
        <div
          className="
            grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6
            mb-12 md:mb-16
          "
        >
          {[
            { value: "500+", label: "Active Teams" },
            { value: "50K+", label: "Boards Created" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9/5", label: "User Rating" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="
                text-center p-5
                glass-panel rounded-xl
                hover:glass-border
                transition-all duration-300
              "
            >
              <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--cyan-400)] to-[var(--accent-400)] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Carousel container */}
          <div
            ref={scrollRef}
            className="
              flex overflow-x-auto snap-x snap-mandatory
              scroll-smooth hide-scrollbar
              -mx-4 px-4
              md:mx-0 md:px-0
            "
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.author}
                className="
                  flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]
                  snap-start
                  mr-4 md:mr-6
                  last:mr-0
                "
              >
                <div
                  className={`
                    h-full
                    glass-panel rounded-2xl
                    p-6 md:p-8
                    transition-all duration-300
                    ${
                      index === currentIndex
                        ? "glass-border ring-1 ring-[var(--accent-400)]/30"
                        : ""
                    }
                  `}
                >
                  {/* Quote icon with gradient */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-400)]/20 to-[var(--cyan-400)]/20 flex items-center justify-center mb-4">
                    <Quote className="w-5 h-5 text-[var(--accent-400)]" />
                  </div>

                  {/* Quote text */}
                  <blockquote className="text-white text-lg mb-6 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  {/* Author info */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                        w-12 h-12 rounded-full
                        ${testimonial.avatarColor}
                        flex items-center justify-center
                        text-white font-semibold shadow-lg
                      `}
                    >
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-white/60">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows - desktop only */}
          <button
            type="button"
            onClick={goToPrev}
            className="
              hidden md:flex
              absolute top-1/2 -left-12 -translate-y-1/2
              w-10 h-10 rounded-full
              glass-panel
              items-center justify-center
              text-white/60 hover:text-white
              hover:glass-border
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)]
            "
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="
              hidden md:flex
              absolute top-1/2 -right-12 -translate-y-1/2
              w-10 h-10 rounded-full
              glass-panel
              items-center justify-center
              text-white/60 hover:text-white
              hover:glass-border
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)]
            "
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`
                  h-2 rounded-full
                  transition-all duration-300
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-800)]
                  ${
                    index === currentIndex
                      ? "w-6 bg-gradient-to-r from-[var(--cyan-400)] to-[var(--accent-400)]"
                      : "w-2 bg-white/20 hover:bg-white/30"
                  }
                `}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
