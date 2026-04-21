"use client";

import { useState, useEffect } from "react";
import { Link2, Plus, Trash2, Copy, Check, Clock } from "lucide-react";
import {
  createShareLink,
  revokeShareLink,
  listBoardShareLinks,
  buildShareUrl,
  type ShareLink,
  type ExpiryOption,
} from "@/services/share-service";
import { useAuth } from "@/hooks/use-auth";
import { BlueprintModal } from "@/components/ui/blueprint-modal";

interface ShareModalProps {
  boardId: string;
  workspaceId: string;
  onClose: () => void;
}

const EXPIRY_LABELS: Record<NonNullable<ExpiryOption> | "never", string> = {
  "1d": "1 day",
  "7d": "7 days",
  "30d": "30 days",
  never: "Never",
};

function ExpiryBadge({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt)
    return <span className="text-white/30 text-xs">Never expires</span>;
  const date = new Date(expiresAt);
  const expired = date < new Date();
  return (
    <span className={`text-xs ${expired ? "text-red-400" : "text-white/40"}`}>
      {expired ? "Expired" : `Expires ${date.toLocaleDateString()}`}
    </span>
  );
}

export function ShareModal({ boardId, workspaceId, onClose }: ShareModalProps) {
  const { user } = useAuth();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiry, setNewExpiry] = useState<ExpiryOption>("7d");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listBoardShareLinks(boardId)
      .then((data) => {
        if (!cancelled) setLinks(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load share links");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    setError(null);
    try {
      const link = await createShareLink(boardId, workspaceId, user.$id, {
        label: newLabel.trim() || undefined,
        expiresIn: newExpiry,
      });
      setLinks((prev) => [link, ...prev]);
      setNewLabel("");
    } catch {
      setError("Failed to create share link");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(linkId: string) {
    try {
      await revokeShareLink(linkId);
      setLinks((prev) => prev.filter((l) => l.$id !== linkId));
    } catch {
      setError("Failed to revoke link");
    }
  }

  async function handleCopy(link: ShareLink) {
    const url = buildShareUrl(link.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(link.$id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <BlueprintModal
      isOpen={true}
      onClose={onClose}
      size="md"
      showCloseButton={false}
    >
      <div className="flex flex-col -mt-4 -mx-4 -mb-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-(--accent-400)">
            <Link2 className="w-4 h-4" />
            <span className="font-semibold text-sm">Share via link</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        {/* Create new link */}
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-white/50 text-xs mb-3">
            Anyone with the link can view this board without signing in.
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Link label (optional)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40 transition"
            />
            <div className="flex gap-2">
              <select
                value={newExpiry ?? "never"}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewExpiry(v === "never" ? null : (v as ExpiryOption));
                }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40 transition"
              >
                {(
                  Object.keys(EXPIRY_LABELS) as Array<
                    keyof typeof EXPIRY_LABELS
                  >
                ).map((key) => (
                  <option key={key} value={key}>
                    Expires: {EXPIRY_LABELS[key]}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>

        {/* Existing links */}
        <div className="px-4 py-3 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-white/30 text-sm text-center py-4">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-white/25 text-sm text-center py-4">
              No active share links yet
            </p>
          ) : (
            <ul className="space-y-2">
              {links.map((link) => (
                <li
                  key={link.$id}
                  className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {link.label || "Untitled link"}
                    </p>
                    <ExpiryBadge expiresAt={link.expiresAt} />
                  </div>
                  <button
                    onClick={() => handleCopy(link)}
                    className="shrink-0 text-white/40 hover:text-(--accent-400) transition-colors"
                    aria-label="Copy link"
                  >
                    {copiedId === link.$id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevoke(link.$id)}
                    className="shrink-0 text-white/30 hover:text-red-400 transition-colors"
                    aria-label="Revoke link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer note */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-1.5 text-white/25 text-xs">
          <Clock className="w-3 h-3 shrink-0" />
          Viewers see a read-only snapshot. Revoking a link takes effect
          immediately.
        </div>
      </div>
    </BlueprintModal>
  );
}
