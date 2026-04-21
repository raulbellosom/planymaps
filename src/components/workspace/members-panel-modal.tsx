"use client";

/**
 * MembersPanelModal Component
 * Workspace members management:
 *  - Lists members with role dropdowns (gated by canManageWorkspaceMember)
 *  - Allows removing members (gated by canRemoveWorkspaceMember)
 *  - Lists pending invitations with Cancel button (gated by canRevokeInvitation)
 *  - "Invite member" button opens InviteModal
 *
 * Subscribes to workspace_invitations realtime events to keep the
 * pending list fresh.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Users,
  UserPlus,
  Trash2,
  ChevronDown,
  Loader2,
  Mail,
  Crown,
  Shield,
  Pencil,
  Eye,
  Ban,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  listWorkspaceMembers,
  updateMemberRole,
  removeWorkspaceMember,
  getMemberRole,
} from "@/services/workspace-service";
import {
  getWorkspaceInvitations,
  revokeInvitation,
} from "@/services/invitation-service";
import { subscribeToWorkspaceInvitations } from "@/lib/realtime/realtime-service";
import { findUserById } from "@/services/users-service";
import {
  canManageWorkspaceMember,
  canRemoveWorkspaceMember,
  canInviteToWorkspace,
  canRevokeInvitation,
} from "@/lib/authorization";
import {
  WorkspaceMember,
  WorkspaceRole,
  roleDisplayNames,
} from "@/types/workspace";
import type { WorkspaceInvitation, InvitableRole } from "@/types/invitation";
import { showError, showSuccess } from "@/lib/toast";
import { InviteModal } from "@/components/invitations/invite-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface MembersPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

interface MemberWithProfile extends WorkspaceMember {
  displayName: string;
  email: string | null;
  avatarUrl?: string;
}

const ASSIGNABLE_ROLES: InvitableRole[] = ["admin", "editor", "viewer"];

const ROLE_ICONS: Record<WorkspaceRole, React.ReactNode> = {
  owner: <Crown className="w-3.5 h-3.5 text-amber-400" />,
  admin: <Shield className="w-3.5 h-3.5 text-purple-400" />,
  editor: <Pencil className="w-3.5 h-3.5 text-cyan-400" />,
  viewer: <Eye className="w-3.5 h-3.5 text-slate-400" />,
};

export function MembersPanelModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}: MembersPanelModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [actorRole, setActorRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMemberAction, setPendingMemberAction] = useState<
    Record<string, "role" | "remove">
  >({});
  const [pendingInvitationAction, setPendingInvitationAction] = useState<
    Record<string, "revoke">
  >({});
  const [openRoleMenuFor, setOpenRoleMenuFor] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] =
    useState<MemberWithProfile | null>(null);
  const [confirmCancelInvitation, setConfirmCancelInvitation] =
    useState<WorkspaceInvitation | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [memberDocs, invitationDocs, currentRole] = await Promise.all([
        listWorkspaceMembers(workspaceId),
        getWorkspaceInvitations(workspaceId, "pending"),
        getMemberRole(workspaceId, user.$id),
      ]);

      // Resolve display names + emails for each member (best-effort)
      const enriched = await Promise.all(
        memberDocs.map(async (m): Promise<MemberWithProfile> => {
          const profile = await findUserById(m.userId).catch(() => null);
          const prefs = profile?.prefs as Record<string, unknown> | undefined;
          return {
            ...m,
            displayName: profile?.name?.trim() || profile?.email || m.userId,
            email: profile?.email ?? null,
            avatarUrl: prefs?.avatarUrl as string | undefined,
          };
        }),
      );

      if (!mountedRef.current) return;
      setMembers(enriched);
      setInvitations(invitationDocs);
      setActorRole(currentRole);
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load members";
      setError(message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, workspaceId]);

  // Initial + reload when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAll();
    }
  }, [isOpen, loadAll]);

  // Realtime: keep invitations panel in sync
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToWorkspaceInvitations(workspaceId, {
      onCreated: (invitation) => {
        if (!mountedRef.current) return;
        if (invitation.status !== "pending") return;
        setInvitations((prev) => {
          if (prev.some((i) => i.$id === invitation.$id)) return prev;
          return [invitation, ...prev];
        });
      },
      onUpdated: (invitation) => {
        if (!mountedRef.current) return;
        setInvitations((prev) => {
          if (invitation.status !== "pending") {
            // If accepted, also refresh members list
            if (invitation.status === "accepted") {
              loadAll();
            }
            return prev.filter((i) => i.$id !== invitation.$id);
          }
          const exists = prev.some((i) => i.$id === invitation.$id);
          if (!exists) return [invitation, ...prev];
          return prev.map((i) => (i.$id === invitation.$id ? invitation : i));
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, workspaceId, loadAll]);

  const sortedMembers = useMemo(() => {
    const order: Record<WorkspaceRole, number> = {
      owner: 0,
      admin: 1,
      editor: 2,
      viewer: 3,
    };
    return [...members].sort((a, b) => order[a.role] - order[b.role]);
  }, [members]);

  const handleRoleChange = useCallback(
    async (member: MemberWithProfile, newRole: WorkspaceRole) => {
      if (!user) return;
      if (member.role === newRole) {
        setOpenRoleMenuFor(null);
        return;
      }
      setOpenRoleMenuFor(null);
      setPendingMemberAction((prev) => ({ ...prev, [member.$id]: "role" }));
      try {
        await updateMemberRole(workspaceId, member.userId, newRole);
        if (!mountedRef.current) return;
        setMembers((prev) =>
          prev.map((m) => (m.$id === member.$id ? { ...m, role: newRole } : m)),
        );
        showSuccess(
          "Role updated",
          `${member.displayName} is now ${roleDisplayNames[newRole]}`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update role";
        showError("Failed to update role", message);
      } finally {
        if (mountedRef.current) {
          setPendingMemberAction((prev) => {
            const next = { ...prev };
            delete next[member.$id];
            return next;
          });
        }
      }
    },
    [user, workspaceId],
  );

  const handleRemoveMember = useCallback(
    (member: MemberWithProfile) => {
      if (!user) return;
      setConfirmRemoveMember(member);
    },
    [user],
  );

  const doRemoveMember = useCallback(async () => {
    const member = confirmRemoveMember;
    if (!member || !user) return;
    setConfirmRemoveMember(null);
    setPendingMemberAction((prev) => ({ ...prev, [member.$id]: "remove" }));
    try {
      await removeWorkspaceMember(workspaceId, member.userId);
      if (!mountedRef.current) return;
      setMembers((prev) => prev.filter((m) => m.$id !== member.$id));
      showSuccess("Member removed", `${member.displayName} has been removed.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      showError("Failed to remove member", message);
    } finally {
      if (mountedRef.current) {
        setPendingMemberAction((prev) => {
          const next = { ...prev };
          delete next[member.$id];
          return next;
        });
      }
    }
  }, [confirmRemoveMember, user, workspaceId]);

  const handleCancelInvitation = useCallback(
    (invitation: WorkspaceInvitation) => {
      if (!user) return;
      setConfirmCancelInvitation(invitation);
    },
    [user],
  );

  const doCancelInvitation = useCallback(async () => {
    const invitation = confirmCancelInvitation;
    if (!invitation || !user) return;
    setConfirmCancelInvitation(null);
    setPendingInvitationAction((prev) => ({
      ...prev,
      [invitation.$id]: "revoke",
    }));
    try {
      await revokeInvitation(invitation.$id, user.$id);
      if (!mountedRef.current) return;
      setInvitations((prev) => prev.filter((i) => i.$id !== invitation.$id));
      showSuccess("Invitation cancelled");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel invitation";
      showError("Failed to cancel invitation", message);
    } finally {
      if (mountedRef.current) {
        setPendingInvitationAction((prev) => {
          const next = { ...prev };
          delete next[invitation.$id];
          return next;
        });
      }
    }
  }, [confirmCancelInvitation, user]);

  if (!isOpen) return null;

  const canInvite = canInviteToWorkspace(actorRole);

  return (
    <>
      <ConfirmDialog
        isOpen={confirmRemoveMember !== null}
        onConfirm={() => void doRemoveMember()}
        onCancel={() => setConfirmRemoveMember(null)}
        title="Remove member"
        message={`Remove ${confirmRemoveMember?.displayName ?? ""} from this workspace?`}
        confirmLabel="Remove"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={confirmCancelInvitation !== null}
        onConfirm={() => void doCancelInvitation()}
        onCancel={() => setConfirmCancelInvitation(null)}
        title="Cancel invitation"
        message={`Cancel invitation to ${confirmCancelInvitation?.inviteeEmail ?? ""}?`}
        confirmLabel="Cancel invitation"
        variant="danger"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />

        <div className="bg-[#12141a]/85 backdrop-blur-md backdrop-saturate-150 border border-white/10 relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Corner Markers - Top Left */}
          <div
            className="absolute top-0 left-0 w-6 h-6 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute top-0 left-0 w-full h-full border-l-2 border-t-2 border-[var(--accent-500)]/60 rounded-tl-xl" />
          </div>
          {/* Corner Markers - Top Right */}
          <div
            className="absolute top-0 right-0 w-6 h-6 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute top-0 right-0 w-full h-full border-r-2 border-t-2 border-[var(--accent-500)]/60 rounded-tr-xl" />
          </div>
          {/* Corner Markers - Bottom Left */}
          <div
            className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute bottom-0 left-0 w-full h-full border-l-2 border-b-2 border-[var(--accent-500)]/60 rounded-bl-xl" />
          </div>
          {/* Corner Markers - Bottom Right */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute bottom-0 right-0 w-full h-full border-r-2 border-b-2 border-[var(--accent-500)]/60 rounded-br-xl" />
          </div>
          {/* Inner dashed border */}
          <div
            className="absolute inset-2 border border-dashed border-[var(--accent-500)]/20 rounded-lg pointer-events-none"
            aria-hidden="true"
          />
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Workspace members
                </h2>
                <p className="text-sm text-white/50">{workspaceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canInvite && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite member
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            {isLoading && members.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            )}

            {/* Members */}
            <section>
              <h3 className="text-sm font-semibold text-white mb-3">
                Members ({members.length})
              </h3>
              <div className="space-y-2">
                {sortedMembers.map((member) => {
                  const isSelf = member.userId === user?.$id;
                  const canChangeRole =
                    !isSelf &&
                    actorRole !== null &&
                    canManageWorkspaceMember(actorRole, member.role);
                  const canRemove =
                    !isSelf &&
                    actorRole !== null &&
                    canRemoveWorkspaceMember(actorRole, member.role);
                  const action = pendingMemberAction[member.$id];

                  return (
                    <div
                      key={member.$id}
                      className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/8 rounded-lg"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium overflow-hidden">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          member.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {member.displayName}
                            {isSelf && (
                              <span className="ml-2 text-xs text-white/30">
                                (you)
                              </span>
                            )}
                          </p>
                        </div>
                        {member.email && (
                          <p className="text-xs text-white/40 truncate">
                            {member.email}
                          </p>
                        )}
                      </div>

                      {/* Role */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!canChangeRole || Boolean(action)}
                          onClick={() =>
                            setOpenRoleMenuFor((curr) =>
                              curr === member.$id ? null : member.$id,
                            )
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            canChangeRole
                              ? "bg-white/8 hover:bg-white/15 border-white/15 text-white"
                              : "bg-white/5 border-white/8 text-white/40 cursor-default"
                          }`}
                        >
                          {ROLE_ICONS[member.role]}
                          {roleDisplayNames[member.role]}
                          {canChangeRole && (
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          )}
                        </button>
                        {openRoleMenuFor === member.$id && canChangeRole && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenRoleMenuFor(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white/10 backdrop-blur-xl border border-white/15 rounded-lg shadow-xl overflow-hidden">
                              {ASSIGNABLE_ROLES.filter(
                                (role) =>
                                  actorRole !== null &&
                                  canManageWorkspaceMember(actorRole, role),
                              ).map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => handleRoleChange(member, role)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/15 transition-colors ${
                                    role === member.role
                                      ? "bg-white/15 text-white"
                                      : "text-white/50"
                                  }`}
                                >
                                  {ROLE_ICONS[role]}
                                  {roleDisplayNames[role]}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Remove */}
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          disabled={Boolean(action)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                          aria-label={`Remove ${member.displayName}`}
                        >
                          {action === "remove" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Pending Invitations */}
            <section>
              <h3 className="text-sm font-semibold text-white mb-3">
                Pending invitations ({invitations.length})
              </h3>
              {invitations.length === 0 ? (
                <p className="text-sm text-white/30 py-4 text-center bg-white/5 border border-white/8 rounded-lg">
                  No pending invitations
                </p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((invitation) => {
                    const canCancel =
                      user !== null &&
                      actorRole !== null &&
                      canRevokeInvitation(invitation, user.$id, actorRole);
                    const action = pendingInvitationAction[invitation.$id];
                    return (
                      <div
                        key={invitation.$id}
                        className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/8 rounded-lg"
                      >
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {invitation.inviteeEmail}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                            <span className="flex items-center gap-1">
                              {ROLE_ICONS[invitation.role]}
                              {roleDisplayNames[invitation.role]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              expires{" "}
                              {new Date(
                                invitation.expiresAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelInvitation(invitation)}
                            disabled={Boolean(action)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/10 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {action === "revoke" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        onInviteSent={() => {
          // Realtime should handle the addition, but reload as fallback
          loadAll();
        }}
      />
    </>
  );
}
