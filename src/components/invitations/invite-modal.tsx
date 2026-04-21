"use client";

/**
 * InviteModal Component
 * Modal for inviting users to a workspace
 */

import { useState } from "react";
import { Mail, UserPlus, ChevronDown, Loader2 } from "lucide-react";
import { createInvitation } from "@/services/invitation-service";
import { WorkspaceRole } from "@/types/workspace";
import { InvitationStatus, InvitableRole } from "@/types/invitation";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";
import { BlueprintModal } from "@/components/ui/blueprint-modal";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  onInviteSent?: () => void;
}

const ROLE_OPTIONS: {
  value: InvitableRole;
  label: string;
  description: string;
}[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Can manage settings and members",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can create and edit content",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view content only",
  },
];

export function InviteModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  onInviteSent,
}: InviteModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if user is trying to invite themselves
  const isOwnEmail = email.toLowerCase() === user?.email?.toLowerCase();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!email.trim()) {
      setValidationError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    if (isOwnEmail) {
      setValidationError("You cannot invite yourself");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);

    try {
      await createInvitation({
        workspaceId,
        inviterUserId: user!.$id,
        inviteeEmail: email.toLowerCase().trim(),
        role,
      });

      showSuccess("Invitation sent", `An invitation has been sent to ${email}`);

      setEmail("");
      setRole("viewer");
      onInviteSent?.();
      onClose();
    } catch (err) {
      console.error("Failed to send invitation:", err);
      showError(
        "Failed to send invitation",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not open — delegated to BlueprintModal
  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite to ${workspaceName}`}
      size="md"
      showCloseButton
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email Input */}
        <div>
          <label
            htmlFor="invite-email"
            className="block text-xs font-medium text-white/60 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError("");
              }}
              placeholder="colleague@example.com"
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 transition ${
                validationError ? "border-red-500" : "border-white/10"
              }`}
              disabled={isSubmitting}
            />
          </div>
          {validationError && (
            <p className="mt-1.5 text-sm text-red-400">{validationError}</p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-2">
            Role
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 transition"
            >
              <span>{ROLE_OPTIONS.find((r) => r.value === role)?.label}</span>
              <ChevronDown
                className={`w-4 h-4 text-white/30 transition-transform ${
                  showRoleDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showRoleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRoleDropdown(false)}
                />
                <div className="absolute z-20 w-full mt-1 bg-white/10 backdrop-blur-xl border border-white/15 rounded-lg shadow-xl overflow-hidden">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRole(option.value);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                        role === option.value ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="text-white text-sm font-medium">
                        {option.label}
                      </div>
                      <div className="text-xs text-white/50">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/8">
          <h4 className="text-sm font-medium text-white mb-2">
            Role Permissions
          </h4>
          <ul className="space-y-1.5 text-sm text-white/50">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-white">Admin:</strong> Manage workspace
                settings, members, and content
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-white">Editor:</strong> Create and edit
                boards and content
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-white">Viewer:</strong> View content
                only, no editing
              </span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-white/8">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </BlueprintModal>
  );
}
