/**
 * Planymaps Landing Page
 *
 * A high-impact landing page for the collaborative canvas platform,
 * featuring hero section, feature showcase, social proof, pricing,
 * and conversion-focused CTAs.
 */

import {
  Header,
  HeroSection,
  FeatureSection,
  SocialProof,
  PricingSection,
  FinalCTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--navy-900)]">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
          focus:z-50 focus:px-4 focus:py-2
          focus:bg-[var(--cyan-500)] focus:text-[var(--navy-900)]
          focus:rounded-lg
        "
      >
        Skip to main content
      </a>

      {/* Header / Navigation */}
      <Header />

      {/* Main content */}
      <main id="main-content">
        {/* Hero Section */}
        <HeroSection />

        {/* Feature Showcase */}
        <FeatureSection />

        {/* Social Proof / Testimonials */}
        <SocialProof />

        {/* Pricing Tiers */}
        <PricingSection />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
