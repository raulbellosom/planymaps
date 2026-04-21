"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { TooltipSimple } from "@/components/ui/tooltip";

export function UserDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, router]);

  const handleProfile = useCallback(() => {
    setIsOpen(false);
    router.push("/profile");
  }, [router]);

  const getInitials = useCallback(() => {
    if (!user) return "?";
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  }, [user]);

  const getAvatarUrl = useCallback(() => {
    if (!user) return null;
    const prefs = user.prefs as Record<string, unknown>;
    if (prefs?.avatarUrl) {
      return prefs.avatarUrl as string;
    }
    return null;
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Don't render anything if no user - but ensure hooks are consistent
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <TooltipSimple content="User menu">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150 hover:bg-[#1E3A5F] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          id="user-menu-button"
          aria-label="User menu"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium border-2 border-[#2A4A6F]">
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl() || ""}
                alt={user.name || user.email}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement?.classList.add("flex");
                  e.currentTarget.parentElement?.classList.remove(
                    "overflow-hidden",
                  );
                }}
              />
            ) : (
              getInitials()
            )}
          </div>

          {/* User Name (hidden on mobile) */}
          <span className="hidden md:block text-white text-sm font-medium">
            {user.name || user.email.split("@")[0]}
          </span>

          {/* Chevron */}
          <ChevronDown
            className={`w-4 h-4 text-[#94A3B8] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </TooltipSimple>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-48 py-1 bg-[#122033] border border-[#2A4A6F] rounded-lg shadow-xl transition-all duration-150 z-50 ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-1"
        }`}
        role="menu"
        aria-labelledby="user-menu-button"
      >
        {/* Profile Settings */}
        <button
          onClick={handleProfile}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#1E3A5F] transition-colors duration-150 focus:outline-none focus:bg-[#1E3A5F]"
          role="menuitem"
        >
          <Settings className="w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
          <span>Profile Settings</span>
        </button>

        {/* Divider */}
        <div className="border-t border-[#2A4A6F] my-1" />

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-[#1E3A5F] hover:text-red-300 transition-colors duration-150 focus:outline-none focus:bg-[#1E3A5F]"
          role="menuitem"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
