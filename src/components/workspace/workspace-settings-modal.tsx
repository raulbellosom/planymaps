"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Building2, Link as LinkIcon, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getMemberRole,
  updateWorkspace,
  isSlugTaken,
} from "@/services/workspace-service";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { BlueprintButton } from "@/components/auth";
import { BlueprintInput } from "@/components/auth/blueprint-input";
import { showSuccess, showError } from "@/lib/toast";
import type { Workspace } from "@/types/workspace";
import { roleRank } from "@/lib/authorization";

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  /** Called after a successful save so the parent can refresh */
  onUpdated: () => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

function validateSlugFormat(value: string): string {
  if (!value) return "Slug is required";
  if (value.length < 3) return "Slug must be at least 3 characters";
  if (value.length > 50) return "Slug must be 50 characters or less";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    return "Only lowercase letters, numbers, and hyphens";
  return "";
}

export function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspace,
  onUpdated,
}: WorkspaceSettingsModalProps) {
  const { user } = useAuth();

  // Permission state
  const [canEdit, setCanEdit] = useState<boolean | null>(null); // null = loading

  // Form state
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [slugError, setSlugError] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form & check permission whenever modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    setName(workspace.name);
    setSlug(workspace.slug);
    setSlugError("");
    setCanEdit(null);

    getMemberRole(workspace.$id, user.$id)
      .then((role) => {
        setCanEdit(role !== null && roleRank(role) >= roleRank("admin"));
      })
      .catch(() => setCanEdit(false));
  }, [isOpen, workspace, user]);

  const checkSlug = useCallback(
    (value: string) => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
      const fmt = validateSlugFormat(value);
      if (fmt) {
        setSlugError(fmt);
        return;
      }
      // No need to check availability if it hasn't changed
      if (value === workspace.slug) {
        setSlugError("");
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
    },
    [workspace.slug],
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(raw);
    checkSlug(raw);
  };

  const handleGenerateSlug = () => {
    const generated = generateSlug(name);
    setSlug(generated);
    checkSlug(generated);
  };

  const handleSave = async () => {
    if (!name.trim() || slugError || isCheckingSlug) return;

    setIsSaving(true);
    try {
      // Final availability check (skip if slug unchanged)
      if (slug !== workspace.slug) {
        const taken = await isSlugTaken(slug);
        if (taken) {
          setSlugError("This slug is already taken");
          return;
        }
      }
      await updateWorkspace(workspace.$id, {
        name: name.trim(),
        slug,
      });
      showSuccess("Workspace updated", `"${name.trim()}" has been updated.`);
      onUpdated();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update workspace";
      showError("Update failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      title="Workspace Settings"
      size="md"
    >
      {/* Loading permission */}
      {canEdit === null && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-500 border-t-transparent" />
        </div>
      )}

      {/* No permission */}
      {canEdit === false && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <ShieldAlert className="w-10 h-10 text-amber-400" />
          <p className="text-(--gray-300) font-medium">
            Only owners and admins can edit workspace settings.
          </p>
          <BlueprintButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </BlueprintButton>
        </div>
      )}

      {/* Edit form */}
      {canEdit === true && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <BlueprintInput
            id="ws-settings-name"
            name="ws-settings-name"
            type="text"
            label="Workspace Name"
            value={name}
            onChange={handleNameChange}
            placeholder="My Workspace"
            leftIcon={<Building2 className="w-5 h-5" />}
            required
          />

          <div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <BlueprintInput
                  id="ws-settings-slug"
                  name="ws-settings-slug"
                  type="text"
                  label="Slug"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="my-workspace"
                  leftIcon={<LinkIcon className="w-5 h-5" />}
                  error={slugError}
                  required
                />
              </div>
              <BlueprintButton
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleGenerateSlug}
                className="mb-0.5"
                disabled={!name.trim()}
              >
                Auto
              </BlueprintButton>
            </div>
            {isCheckingSlug && (
              <p className="text-xs text-cyan-400 mt-1">
                Checking availability…
              </p>
            )}
            {slug &&
              !slugError &&
              !isCheckingSlug &&
              slug !== workspace.slug && (
                <p className="text-xs text-green-400 mt-1">Slug available</p>
              )}
            {slug === workspace.slug && !slugError && (
              <p className="text-xs text-(--gray-500) mt-1">Current slug</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <BlueprintButton
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSaving}
              type="button"
            >
              Cancel
            </BlueprintButton>
            <BlueprintButton
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSaving}
              loadingText="Saving…"
              disabled={
                !name.trim() ||
                !!slugError ||
                isCheckingSlug ||
                (name.trim() === workspace.name && slug === workspace.slug)
              }
            >
              Save Changes
            </BlueprintButton>
          </div>
        </form>
      )}
    </BlueprintModal>
  );
}
