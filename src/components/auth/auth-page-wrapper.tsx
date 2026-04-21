"use client";

/**
 * AuthPageWrapper
 * Consistent page layout for authentication pages
 */

import Link from "next/link";

interface AuthLink {
  href: string;
  label: string;
}

interface AuthPageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLinks?: AuthLink[];
}

export function AuthPageWrapper({
  title,
  subtitle,
  children,
  footerLinks = [],
}: AuthPageWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">
          Planymaps
        </h1>
      </div>

      {/* Card Content */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer Links */}
      {footerLinks.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                text-gray-400 hover:text-cyan-400
                transition-colors duration-150
              "
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Version */}
      <div className="mt-12 text-xs text-gray-500">
        Blueprint Edition v1.0.0
      </div>
    </div>
  );
}
