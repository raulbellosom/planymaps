"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Folder, User, ArrowLeft, HelpCircle } from "lucide-react";
import { BlueprintButton } from "@/components/auth";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/workspace");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-6">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1E3A5F 1px, transparent 1px),
              linear-gradient(to bottom, #1E3A5F 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Animated 404 Icon */}
        <div className="mb-8 relative">
          <div className="w-40 h-40 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
          {/* Decorative rings */}
          <div
            className="absolute inset-0 w-40 h-40 mx-auto border border-cyan-500/30 rounded-full animate-ping"
            style={{ animationDuration: "3s" }}
          />
          <div className="absolute inset-4 w-32 h-32 mx-auto border border-blue-500/20 rounded-full" />
        </div>

        {/* 404 Title */}
        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
          404
        </h1>

        {/* Error Title */}
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
          Page Not Found
        </h2>

        {/* Error Description */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Check the
          URL or navigate to one of the sections below.
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/workspace"
            className="group bg-[#122033]/80 border border-[#2A4A6F] rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-500/20 transition-colors">
              <Folder className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-white font-medium text-sm">Workspaces</p>
            <p className="text-gray-500 text-xs mt-1">View your boards</p>
          </Link>

          <Link
            href="/profile"
            className="group bg-[#122033]/80 border border-[#2A4A6F] rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-500/20 transition-colors">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-white font-medium text-sm">Profile</p>
            <p className="text-gray-500 text-xs mt-1">Account settings</p>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#122033] border border-[#2A4A6F] text-white font-semibold rounded-lg hover:bg-[#1E3A5F] hover:border-cyan-500/50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            href="/workspace"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-cyan-500/25"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>
        </div>

        {/* Contact Support */}
        <div className="mt-8 pt-6 border-t border-[#2A4A6F]">
          <p className="text-gray-500 text-sm mb-3">
            Need help? Contact our support team
          </p>
          <a
            href="mailto:support@planymaps.com"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
