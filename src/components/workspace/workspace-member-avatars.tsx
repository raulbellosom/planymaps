"use client";

import { useEffect, useState } from "react";
import { listWorkspaceMembers } from "@/services/workspace-service";
import { findUserById } from "@/services/users-service";
import { Tooltip } from "@/components/ui/tooltip";

interface MemberProfile {
  userId: string;
  name: string | null;
  email: string;
  prefs?: Record<string, unknown>;
}

const AVATAR_COLORS = [
  "bg-cyan-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function avatarColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) & 0xffff;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

interface WorkspaceMemberAvatarsProps {
  workspaceId: string;
  /** Max avatars to show before the "+N" overflow circle */
  max?: number;
  className?: string;
}

export function WorkspaceMemberAvatars({
  workspaceId,
  max = 5,
  className = "",
}: WorkspaceMemberAvatarsProps) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const raw = await listWorkspaceMembers(workspaceId);
        if (cancelled) return;

        setTotal(raw.length);

        // Fetch profiles for the first `max` members in parallel (best-effort)
        const slice = raw.slice(0, max);
        const profiles = await Promise.all(
          slice.map(async (m) => {
            try {
              const p = await findUserById(m.userId);
              return {
                userId: m.userId,
                name: p?.name ?? null,
                email: p?.email ?? m.userId,
                prefs: p?.prefs,
              };
            } catch {
              return { userId: m.userId, name: null, email: m.userId };
            }
          }),
        );

        if (!cancelled) setMembers(profiles);
      } catch {
        // silent — avatars are decorative
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, max]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full bg-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (members.length === 0) return null;

  const overflow = total - members.length;

  return (
    <div className={`flex items-center ${className}`}>
      {members.map((m, i) => {
        const prefs = m.prefs as Record<string, unknown> | undefined;
        const imageUrl = prefs?.avatarUrl as string | undefined;

        return (
          <Tooltip
            key={m.userId}
            content={m.name ?? m.email}
            side="top"
            sideOffset={6}
          >
            <div
              className={`
                w-7 h-7 rounded-full flex items-center justify-center
                text-[10px] font-bold text-white ring-2 ring-(--navy-900)
                cursor-default select-none overflow-hidden
                ${avatarColor(m.userId)}
                ${i > 0 ? "-ml-2" : ""}
              `}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={m.name ?? m.email}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>{initials(m.name, m.email)}</span>
              )}
            </div>
          </Tooltip>
        );
      })}

      {overflow > 0 && (
        <Tooltip
          content={`${overflow} more member${overflow > 1 ? "s" : ""}`}
          side="top"
          sideOffset={6}
        >
          <div className="w-7 h-7 rounded-full -ml-2 flex items-center justify-center text-[10px] font-semibold text-white bg-white/15 ring-2 ring-(--navy-900) cursor-default select-none">
            +{overflow}
          </div>
        </Tooltip>
      )}
    </div>
  );
}
