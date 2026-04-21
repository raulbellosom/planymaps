"use client";

/**
 * InvitationResponseModal
 * Full-detail modal for accepting or declining a workspace invitation.
 * Shows workspace name, role, and inviter name pulled from notification data.
 * On success, confirms real-time notification was sent to the inviter.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Loader2,
  UserPlus,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { useWorkspace } from "@/contexts/workspace-context";
import type { Notification } from "@/types/notification";

type ActionState = "idle" | "loading" | "accepted" | "rejected" | "error";

interface InvitationResponseModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful action so the bell can mark the notification read */
  onActionComplete: (notificationId: string) => Promise<void>;
  /** Passed from the parent hook instance to avoid a duplicate subscription */
  accept: (invitationId: string) => Promise<void>;
  reject: (invitationId: string) => Promise<void>;
}

export function InvitationResponseModal({
  notification,
  isOpen,
  onClose,
  onActionComplete,
  accept,
  reject,
}: InvitationResponseModalProps) {
  const { refreshWorkspaces } = useWorkspace();
  const router = useRouter();

  const [actionState, setActionState] = useState<ActionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state whenever the modal opens or the notification changes
  useEffect(() => {
    if (!isOpen) return;
    // Defer to avoid synchronous setState-in-effect lint rule
    const raf = requestAnimationFrame(() => {
      setActionState("idle");
      setErrorMessage(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, notification?.$id]);

  // Auto-close 3 s after a successful action
  useEffect(() => {
    if (actionState !== "accepted" && actionState !== "rejected") return;
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [actionState, onClose]);

  const handleAction = useCallback(
    async (action: "accept" | "reject") => {
      if (!notification) return;
      const invitationId = notification.data?.invitationId;
      if (!invitationId || typeof invitationId !== "string") {
        setErrorMessage("Missing invitation reference. Please refresh.");
        setActionState("error");
        return;
      }

      setActionState("loading");
      setErrorMessage(null);

      try {
        if (action === "accept") {
          await accept(invitationId);
          // Immediately refresh the workspace list so the user sees
          // the new workspace without needing a page reload.
          await refreshWorkspaces();
          setActionState("accepted");
        } else {
          await reject(invitationId);
          setActionState("rejected");
        }
        await onActionComplete(notification.$id).catch(() => {});
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        setActionState("error");
      }
    },
    [notification, accept, reject, onActionComplete, refreshWorkspaces],
  );

  if (!notification) return null;

  const data = notification.data ?? {};
  const workspaceName =
    typeof data.workspaceName === "string"
      ? data.workspaceName
      : "the workspace";
  const role = typeof data.role === "string" ? data.role : "";
  const inviterName =
    typeof data.inviterName === "string" && data.inviterName.trim()
      ? data.inviterName.trim()
      : null;
  const workspaceId =
    typeof data.workspaceId === "string" ? data.workspaceId : null;

  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      title="Workspace Invitation"
      size="md"
      closable={actionState !== "loading"}
      showCloseButton={actionState !== "loading"}
    >
      {/* ── Idle ──────────────────────────────────────────────── */}
      {actionState === "idle" && (
        <div className="flex flex-col gap-5 ">
          {/* Invitation info card */}
          <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="shrink-0 w-11 h-11 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-medium mb-0.5">
                You&apos;ve been invited to
              </p>
              <p className="text-base font-bold text-cyan-300 truncate">
                {workspaceName}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 capitalize">
                    {role}
                  </span>
                )}
                {inviterName && (
                  <span className="text-xs text-[#94A3B8]">
                    Invited by{" "}
                    <span className="text-white font-medium">
                      {inviterName}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Accept to join{" "}
            <span className="text-white font-medium">{workspaceName}</span> with{" "}
            <span className="text-white capitalize">{role}</span> access, or
            decline to dismiss this invitation.
            {inviterName && (
              <>
                {" "}
                <span className="text-white font-medium">
                  {inviterName}
                </span>{" "}
                will be notified of your response in real-time.
              </>
            )}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => handleAction("reject")}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
            <button
              type="button"
              onClick={() => handleAction("accept")}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Accept invitation
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────── */}
      {actionState === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
          <p className="text-sm text-[#94A3B8]">Processing…</p>
        </div>
      )}

      {/* ── Accepted ──────────────────────────────────────────── */}
      {actionState === "accepted" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">
              Invitation accepted!
            </p>
            <p className="text-sm text-[#94A3B8] mt-1">
              You&apos;ve joined{" "}
              <span className="text-white font-medium">{workspaceName}</span>.
            </p>
            {inviterName && (
              <p className="text-xs text-emerald-400 mt-2">
                ✓ <span className="font-medium">{inviterName}</span> has been
                notified in real-time.
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full pt-2 border-t border-white/10">
            {workspaceId && (
              <button
                type="button"
                onClick={() => {
                  router.push("/workspace");
                  onClose();
                }}
                className="flex-1 px-3 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                Go to workspaces
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Rejected ──────────────────────────────────────────── */}
      {actionState === "rejected" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-full bg-[#1E3A5F] border border-[#2A4A6F] flex items-center justify-center">
            <X className="w-7 h-7 text-[#94A3B8]" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">
              Invitation declined
            </p>
            <p className="text-sm text-[#94A3B8] mt-1">
              You&apos;ve declined the invitation to{" "}
              <span className="text-white font-medium">{workspaceName}</span>.
            </p>
            {inviterName && (
              <p className="text-xs text-[#94A3B8] mt-2">
                ✓ <span className="font-medium text-white">{inviterName}</span>{" "}
                has been notified.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {actionState === "error" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              {errorMessage ?? "Something went wrong. Please try again."}
            </p>
          </div>
          <div className="flex gap-2 border-t border-white/10 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setActionState("idle")}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </BlueprintModal>
  );
}
