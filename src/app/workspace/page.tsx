"use client";

/**
 * Workspace Page
 * Lists and creates workspaces with blueprint styling
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  Plus,
  Building2,
  Calendar,
  ChevronRight,
  Link as LinkIcon,
  Users,
  Settings,
} from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { BlueprintButton } from "@/components/auth";
import { BlueprintInput } from "@/components/auth/blueprint-input";
import { showSuccess, showError } from "@/lib/toast";
import { isSlugTaken } from "@/services/workspace-service";
import { MembersPanelModal } from "@/components/workspace/members-panel-modal";
import { WorkspaceSettingsModal } from "@/components/workspace/workspace-settings-modal";
import { WorkspaceMemberAvatars } from "@/components/workspace/workspace-member-avatars";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export default function WorkspacePage() {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    isLoading,
    createNewWorkspace,
    refreshWorkspaces,
  } = useWorkspace();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [membersPanelWorkspace, setMembersPanelWorkspace] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [settingsWorkspace, setSettingsWorkspace] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load workspaces on mount
  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Validate slug format
  const validateSlugFormat = (value: string): string => {
    if (!value) return "";
    if (value.length < 3) return "Slug must be at least 3 characters";
    if (value.length > 50) return "Slug must be 50 characters or less";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
      return "Only lowercase letters, numbers, and hyphens";
    return "";
  };

  // Debounced slug availability check
  const checkSlugAvailability = (value: string) => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    const formatError = validateSlugFormat(value);
    if (formatError) {
      setSlugError(formatError);
      return;
    }
    setIsCheckingSlug(true);
    setSlugError("");
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const taken = await isSlugTaken(value);
        setSlugError(taken ? "This slug is already taken" : "");
      } catch {
        setSlugError("Could not verify slug");
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);
  };

  // Auto-generate slug from name (unless user edited slug manually)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewWorkspaceName(name);
    if (!slugManuallyEdited) {
      const generated = generateSlug(name);
      setSlug(generated);
      if (generated) checkSlugAvailability(generated);
      else setSlugError("");
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(raw);
    setSlugManuallyEdited(true);
    if (raw) checkSlugAvailability(raw);
    else setSlugError("");
  };

  const resetCreateForm = () => {
    setShowCreateModal(false);
    setNewWorkspaceName("");
    setSlug("");
    setSlugError("");
    setSlugManuallyEdited(false);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !slug || slugError || isCheckingSlug)
      return;

    setIsCreating(true);
    try {
      // Final check before creation
      const taken = await isSlugTaken(slug);
      if (taken) {
        setSlugError("This slug is already taken");
        return;
      }
      await createNewWorkspace(newWorkspaceName, slug);
      resetCreateForm();
      showSuccess(
        "Workspace created",
        `"${newWorkspaceName}" has been created successfully.`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create workspace";
      showError("Creation failed", message);
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-(--navy-900) flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-(--cyan-500) border-t-transparent"
          style={{ animationDuration: "1s" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--navy-900)">
      <Navbar />

      {/* Blueprint Background Grid */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--navy-600) 1px, transparent 1px),
              linear-gradient(to bottom, var(--navy-600) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto pt-20 md:pt-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-(--cyan-400) tracking-tight">
              Workspaces
            </h1>
            <p className="text-(--gray-400) mt-1">
              Manage your workspaces and boards
            </p>
          </div>
          <div className="flex gap-3">
            <BlueprintButton
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Workspace
            </BlueprintButton>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"
              style={{ animationDuration: "1s" }}
            />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && workspaces.length === 0 && (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-(--cyan-500)/10 flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-(--cyan-400)" />
            </div>
            <h2 className="text-xl font-semibold text-(--gray-50) mb-2">
              No workspaces yet
            </h2>
            <p className="text-(--gray-400) mb-6">
              Create your first workspace to start collaborating
            </p>
            <BlueprintButton
              variant="primary"
              size="lg"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Create Your First Workspace
            </BlueprintButton>
          </div>
        )}

        {/* Workspace list */}
        {!isLoading && workspaces.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace.$id}
                className={`
                  group
                  glass-panel rounded-xl
                  p-6
                  transition-all duration-200
                  hover:glass-border hover:shadow-lg hover:shadow-(--accent-500)/10 hover:-translate-y-0.5
                  ${
                    currentWorkspace?.$id === workspace.$id
                      ? "glass-border shadow-(--accent-500)/15"
                      : ""
                  }
                `}
              >
                <Link
                  href={`/board?workspace=${workspace.$id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-(--cyan-500)/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-(--cyan-400)" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-(--gray-500) group-hover:text-(--cyan-400) transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-(--gray-50) mb-1">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-(--gray-500) flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created{" "}
                    {workspace.$createdAt
                      ? new Date(workspace.$createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </Link>

                {/* Member avatar stack */}
                <WorkspaceMemberAvatars
                  workspaceId={workspace.$id}
                  className="mt-3"
                />

                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <Link
                    href={`/board?workspace=${workspace.$id}`}
                    className="block"
                  >
                    <BlueprintButton
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Open Workspace
                    </BlueprintButton>
                  </Link>
                  <div className="flex gap-2">
                    <BlueprintButton
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      leftIcon={<Users className="w-4 h-4" />}
                      onClick={() =>
                        setMembersPanelWorkspace({
                          id: workspace.$id,
                          name: workspace.name,
                        })
                      }
                    >
                      Members
                    </BlueprintButton>
                    <BlueprintButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<Settings className="w-4 h-4" />}
                      onClick={() =>
                        setSettingsWorkspace({
                          id: workspace.$id,
                          name: workspace.name,
                        })
                      }
                      aria-label="Workspace settings"
                    >
                      Settings
                    </BlueprintButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      <BlueprintModal
        isOpen={showCreateModal}
        onClose={resetCreateForm}
        title="Create Workspace"
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateWorkspace();
          }}
        >
          <BlueprintInput
            id="workspace-name"
            name="workspace-name"
            type="text"
            label="Workspace Name"
            value={newWorkspaceName}
            onChange={handleNameChange}
            placeholder="My Workspace"
            leftIcon={<Building2 className="w-5 h-5" />}
            required
          />
          <div>
            <BlueprintInput
              id="workspace-slug"
              name="workspace-slug"
              type="text"
              label="Slug"
              value={slug}
              onChange={handleSlugChange}
              placeholder="my-workspace"
              leftIcon={<LinkIcon className="w-5 h-5" />}
              error={slugError}
              required
            />
            {isCheckingSlug && (
              <p className="text-xs text-cyan-400 mt-1">
                Checking availability…
              </p>
            )}
            {slug && !slugError && !isCheckingSlug && (
              <p className="text-xs text-green-400 mt-1">Slug available</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <BlueprintButton
              variant="ghost"
              size="md"
              onClick={resetCreateForm}
              disabled={isCreating}
              type="button"
            >
              Cancel
            </BlueprintButton>
            <BlueprintButton
              variant="primary"
              size="md"
              type="submit"
              isLoading={isCreating}
              loadingText="Creating..."
              disabled={
                !newWorkspaceName.trim() ||
                !slug ||
                !!slugError ||
                isCheckingSlug
              }
            >
              Create
            </BlueprintButton>
          </div>
        </form>
      </BlueprintModal>

      <MembersPanelModal
        isOpen={membersPanelWorkspace !== null}
        onClose={() => setMembersPanelWorkspace(null)}
        workspaceId={membersPanelWorkspace?.id ?? ""}
        workspaceName={membersPanelWorkspace?.name ?? ""}
      />

      {settingsWorkspace && (
        <WorkspaceSettingsModal
          isOpen
          onClose={() => setSettingsWorkspace(null)}
          workspace={
            workspaces.find((w) => w.$id === settingsWorkspace.id) ??
            ({
              $id: settingsWorkspace.id,
              name: settingsWorkspace.name,
              slug: "",
              ownerId: "",
              $createdAt: "",
              $updatedAt: "",
            } as import("@/types/workspace").Workspace)
          }
          onUpdated={() => {
            refreshWorkspaces();
            setSettingsWorkspace(null);
          }}
        />
      )}
    </div>
  );
}
