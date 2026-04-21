"use client";

/**
 * Header Component
 * Sticky navigation header with glassmorphism styling
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoSvg } from "@/components/ui/logo-svg";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${
            isScrolled
              ? "glass-navy shadow-lg shadow-black/10"
              : "bg-transparent"
          }
        `}
        style={{ height: "var(--header-height)" }}
      >
        <div className="max-w-[var(--max-width)] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-[var(--accent-400)] transition-colors duration-200"
          >
            <div className="w-8 h-8">
              <LogoSvg className="w-full h-full" alt="Planymaps" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Planymaps
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="
                  text-sm font-medium text-white/70
                  hover:text-white hover:bg-white/5
                  px-3 py-1.5 rounded-lg
                  transition-all duration-200
                  relative group
                "
              >
                {link.label}
                <span
                  className="
                    absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5
                    bg-gradient-to-r from-[var(--accent-400)] to-[var(--cyan-400)]
                    rounded-full
                    transition-all duration-200
                    group-hover:w-full
                  "
                />
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="
                text-sm font-medium text-white/70
                hover:text-white
                px-4 py-2 rounded-lg
                hover:bg-white/10
                transition-all duration-200
              "
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="
                inline-flex items-center justify-center
                px-5 py-2.5 text-sm font-semibold
                bg-gradient-to-r from-[var(--cyan-500)] to-[var(--accent-500)]
                text-white
                rounded-lg
                shadow-lg shadow-[var(--accent-500)]/25
                hover:shadow-xl hover:shadow-[var(--accent-500)]/30
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[var(--accent-400)] focus:ring-offset-2 focus:ring-offset-transparent
              "
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="
              md:hidden
              p-2 text-white/70 hover:text-white
              hover:bg-white/10 rounded-lg
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)]
            "
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ top: "var(--header-height)" }}
        >
          {/* Backdrop with glass effect */}
          <div
            className="absolute inset-0 glass-heavy"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div
            className="
              absolute top-0 left-0 right-0
              glass-navy
              p-6
              animate-[fadeIn_200ms_ease-out]
            "
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="
                    px-4 py-3 text-base font-medium
                    text-white/80 hover:text-white
                    hover:bg-white/10 rounded-lg
                    transition-all duration-200
                  "
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  w-full text-center px-4 py-3
                  text-sm font-medium
                  text-white/80 hover:text-white
                  bg-white/5 hover:bg-white/10
                  border border-white/15 rounded-lg
                  transition-all duration-200
                "
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  w-full text-center px-4 py-3
                  text-sm font-semibold
                  bg-gradient-to-r from-[var(--cyan-500)] to-[var(--accent-500)]
                  text-white rounded-lg
                  shadow-lg shadow-[var(--accent-500)]/20
                  hover:shadow-xl
                  transition-all duration-200
                "
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
