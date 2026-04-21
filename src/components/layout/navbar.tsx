"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { UserDropdown } from "./user-dropdown";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { TooltipSimple } from "@/components/ui/tooltip";
import { LogoSvg } from "@/components/ui/logo-svg";

interface NavbarProps {
  showBackButton?: boolean;
  backButtonLabel?: string;
  backHref?: string;
}

export function Navbar({
  showBackButton = false,
  backButtonLabel = "Exit",
  backHref,
}: NavbarProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleLogoClick = useCallback(() => {
    // Scroll to top first
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Then navigate based on auth status
    if (isAuthenticated) {
      router.push("/workspace");
    } else {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleBackClick = useCallback(() => {
    router.push(backHref ?? "/workspace");
  }, [router, backHref]);

  return (
    <nav
      role="banner"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 glass-navy border-b border-white/5"
    >
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left: Back button (optional) + Logo + App Name */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <TooltipSimple content={backButtonLabel}>
              <button
                onClick={handleBackClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-(--gray-300) hover:text-white transition-colors text-sm font-medium"
                aria-label={backButtonLabel}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{backButtonLabel}</span>
              </button>
            </TooltipSimple>
          )}
          <TooltipSimple content="Go to home page">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="Go to home page"
            >
              {/* Logo Icon */}
              <div className="w-8 h-8 md:w-10 md:h-10">
                <LogoSvg className="w-full h-full" alt="Planymaps" />
              </div>

              {/* App Name */}
              <span className="text-white font-semibold text-lg md:text-xl tracking-tight">
                Planymaps
              </span>
            </button>
          </TooltipSimple>
        </div>

        {/* Right: Notifications + User Dropdown */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
