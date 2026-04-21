"use client";

/**
 * NotificationBell Component
 * Bell icon with unread badge + dropdown list of notifications.
 * Workspace invitation notifications open InvitationResponseModal for
 * a full accept/decline flow with real-time confirmation to the inviter.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Clock,
  UserPlus,
  Shield,
  Trash2,
  Ban,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useInvitations } from "@/hooks/use-invitations";
import { useAuth } from "@/hooks/use-auth";
import { Notification } from "@/types/notification";
import { TooltipSimple } from "@/components/ui/tooltip";
import { InvitationResponseModal } from "@/components/invitations/InvitationResponseModal";

interface NotificationBellProps {
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { user, isLoading: authLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const {
    invitations,
    isLoading: invitationsLoading,
    accept: acceptInvitation,
    reject: rejectInvitation,
  } = useInvitations();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const getNotificationIcon = useCallback((type: Notification["type"]) => {
    switch (type) {
      case "workspace_invitation":
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case "invitation_accepted":
        return <Check className="w-4 h-4 text-emerald-400" />;
      case "invitation_rejected":
        return <X className="w-4 h-4 text-red-400" />;
      case "invitation_revoked":
        return <Ban className="w-4 h-4 text-orange-400" />;
      case "role_changed":
        return <Shield className="w-4 h-4 text-purple-400" />;
      case "removed_from_workspace":
        return <Trash2 className="w-4 h-4 text-orange-400" />;
      case "workspace_deleted":
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case "ownership_transferred":
        return <Shield className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  const getNotificationColor = useCallback((type: Notification["type"]) => {
    switch (type) {
      case "workspace_invitation":
        return "bg-blue-500/20 border-blue-500/30";
      case "invitation_accepted":
        return "bg-emerald-500/20 border-emerald-500/30";
      case "invitation_rejected":
        return "bg-red-500/20 border-red-500/30";
      case "invitation_revoked":
      case "removed_from_workspace":
      case "workspace_deleted":
        return "bg-orange-500/20 border-orange-500/30";
      case "role_changed":
        return "bg-purple-500/20 border-purple-500/30";
      case "ownership_transferred":
        return "bg-amber-500/20 border-amber-500/30";
      default:
        return "bg-gray-500/20 border-gray-500/30";
    }
  }, []);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        await markAsRead(notification.$id);
      }
    },
    [markAsRead],
  );

  const handleOpenInvitationModal = useCallback(
    (e: React.MouseEvent, notification: Notification) => {
      e.stopPropagation();
      setSelectedInvitation(notification);
      setIsOpen(false);
    },
    [],
  );

  // Don't render if not authenticated
  if (!user || authLoading) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <TooltipSimple content="Notifications">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              refresh();
            }
          }}
          className="relative p-2 rounded-lg transition-colors duration-150 hover:bg-[#1E3A5F] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="w-5 h-5 text-[#94A3B8]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4.5 h-4.5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </TooltipSimple>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-80 md:w-96 max-h-120 overflow-y-auto bg-[#122033] border border-[#2A4A6F] rounded-xl shadow-xl transition-all duration-150 z-50 ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-1"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#122033] border-b border-[#2A4A6F] px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-[#1E3A5F] rounded-lg transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-12 h-12 text-[#3A5A7A] mb-3" />
            <p className="text-[#94A3B8] text-sm">No notifications yet</p>
            <p className="text-[#5A7A9A] text-xs mt-1">
              You&apos;ll see updates about your workspaces here
            </p>
          </div>
        )}

        {/* Notification List */}
        {notifications.length > 0 && (
          <div className="divide-y divide-[#2A4A6F]/50">
            {notifications.map((notification) => {
              const invitationId =
                notification.type === "workspace_invitation" &&
                typeof notification.data?.invitationId === "string"
                  ? notification.data.invitationId
                  : null;
              // Only show action buttons if the invitation is still pending in
              // the user's live invitations list. This prevents buttons from
              // appearing on already-accepted, rejected, or revoked invitations.
              const isPendingInvitation =
                invitationId !== null &&
                !invitationsLoading &&
                invitations.some((i) => i.$id === invitationId);
              // Show a subtle badge while the pending list is still loading
              const isInvitationLoading =
                invitationId !== null && invitationsLoading;

              return (
                <div
                  key={notification.$id}
                  className={`w-full px-4 py-3 text-left transition-colors duration-150 ${
                    !notification.isRead ? "bg-[#1E3A5F]/30" : ""
                  } hover:bg-[#1E3A5F]/50`}
                >
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${getNotificationColor(
                          notification.type,
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${
                            !notification.isRead
                              ? "text-white font-medium"
                              : "text-[#94A3B8]"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-[#5A7A9A] mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-[#5A7A9A]">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(new Date(notification.createdAt))}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                      )}
                    </div>
                  </button>

                  {isInvitationLoading && (
                    <div className="mt-2 h-7 rounded-lg bg-[#1E3A5F]/60 animate-pulse" />
                  )}

                  {isPendingInvitation && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) =>
                          handleOpenInvitationModal(e, notification)
                        }
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleOpenInvitationModal(e, notification)
                        }
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-[#1E3A5F] hover:bg-[#2A4A6F] text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="sticky bottom-0 bg-[#122033] border-t border-[#2A4A6F] px-4 py-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs text-[#5A7A9A] hover:text-[#94A3B8] transition-colors"
            >
              Close notifications
            </button>
          </div>
        )}
      </div>

      {/* Invitation response modal — rendered outside the dropdown so z-index stacks correctly */}
      <InvitationResponseModal
        notification={selectedInvitation}
        isOpen={selectedInvitation !== null}
        onClose={() => setSelectedInvitation(null)}
        onActionComplete={markAsRead}
        accept={acceptInvitation}
        reject={rejectInvitation}
      />
    </div>
  );
}
