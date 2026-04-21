# 11 - Authorization & Workspace Access System

## Overview

This document describes the complete authorization system for Planymaps, implementing **two separate permission layers**:

1. **Platform-level permissions** (Appwrite Auth labels)
2. **Workspace-level permissions** (workspace membership roles)

---

## 1. Conceptual Model

### 1.1 Platform-Level Permissions (Labels)

Platform labels are assigned to Appwrite Auth users and define what a user can do **across the entire platform**.

| Label   | Description                                                          |
| ------- | -------------------------------------------------------------------- |
| `admin` | Full access to the administrative panel and platform-wide management |
| `user`  | Standard user access (default for all registered users)              |

**Rules:**

- A user with the `admin` label can access the admin panel, list all users, and manage labels.
- A user with the `user` label cannot access the admin panel.
- If a user has no labels, they are treated as having the `user` label.
- Labels are stored in Appwrite's user `labels` array attribute.

### 1.2 Workspace-Level Permissions (Membership Roles)

Workspace roles are stored in the `workspace_members` collection and define what a user can do **inside a specific workspace**.

| Role     | Description                                            | Level       |
| -------- | ------------------------------------------------------ | ----------- |
| `owner`  | Full control including ownership transfer and deletion | 3 (highest) |
| `admin`  | Manage workspace settings, members, and most content   | 2           |
| `editor` | Create and edit workspace content                      | 1           |
| `viewer` | Read-only access to workspace content                  | 0           |

**Role Hierarchy:** `owner > admin > editor > viewer`

---

## 2. Roles & Permissions Matrix

### 2.1 Platform-Level Capabilities

| Capability             | `admin`  | `user`        |
| ---------------------- | -------- | ------------- |
| Access admin panel     | ✅       | ❌            |
| List all users         | ✅       | ❌            |
| View user metadata     | ✅       | ❌            |
| Assign/revoke labels   | ✅       | ❌            |
| Change user to admin   | ✅       | ❌            |
| Access user workspaces | ✅ (all) | ❌ (own only) |

### 2.2 Workspace-Level Capabilities

| Capability                | owner | admin | editor | viewer |
| ------------------------- | ----- | ----- | ------ | ------ |
| View workspace            | ✅    | ✅    | ✅     | ✅     |
| Create boards             | ✅    | ✅    | ✅     | ❌     |
| Edit boards               | ✅    | ✅    | ✅     | ❌     |
| Delete boards             | ✅    | ✅    | ❌     | ❌     |
| Invite members            | ✅    | ✅    | ❌     | ❌     |
| Remove members            | ✅    | ✅    | ❌     | ❌     |
| Change member roles       | ✅    | ✅    | ❌     | ❌     |
| Transfer ownership        | ✅    | ❌    | ❌     | ❌     |
| Delete workspace          | ✅    | ❌    | ❌     | ❌     |
| Update workspace settings | ✅    | ✅    | ❌     | ❌     |
| Manage all layers/items   | ✅    | ✅    | ✅     | ❌     |

---

## 3. Appwrite Collections Schema

### 3.1 Existing Collections

#### `workspaces`

| Column     | Type        | Required | Description             |
| ---------- | ----------- | -------- | ----------------------- |
| name       | string(256) | yes      | Workspace display name  |
| slug       | string(256) | yes      | URL-friendly identifier |
| ownerId    | string(256) | yes      | User ID of the owner    |
| createdAt  | datetime    | yes      | Creation timestamp      |
| updatedAt  | datetime    | yes      | Last update timestamp   |
| archivedAt | datetime    | no       | Soft delete timestamp   |

**Indexes:** `idx_owner` on `ownerId`

**Row security:** enabled — document-level `$permissions` are set at creation time by `workspace-service.ts`. The owner gets `read/update/delete`. When a new member is added, `workspace-service.ts` also patches the workspace document to grant that member `read` access. When a member is removed, that permission is revoked.

#### `workspace_members`

| Column      | Type        | Required | Description                  |
| ----------- | ----------- | -------- | ---------------------------- |
| workspaceId | string(256) | yes      | Reference to workspace       |
| userId      | string(256) | yes      | Reference to user            |
| role        | string(32)  | yes      | owner, admin, editor, viewer |
| createdAt   | datetime    | yes      | When user joined             |

**Indexes:**

- `idx_userid` on `userId`
- `idx_workspace` on `workspaceId`
- `idx_user_workspace` on `userId + workspaceId` (composite)

**Row security:** enabled — each membership document grants `read/delete` to the member (`Role.user(userId)`) and full access to the admin label.

### 3.2 Active Collections

#### `share_links`

| Column      | Type        | Required | Description                   |
| ----------- | ----------- | -------- | ----------------------------- |
| token       | string(64)  | yes      | Unique secret token (UUID v4) |
| boardId     | string(256) | yes      | Target board                  |
| workspaceId | string(256) | yes      | Owning workspace              |
| createdBy   | string(256) | yes      | User ID of creator            |
| label       | string(256) | no       | Human-readable description    |
| expiresAt   | datetime    | no       | Null = never expires          |
| isActive    | boolean     | yes      | False = revoked               |

**Indexes:**

- `idx_token` — unique on `token`
- `idx_boardId` — key
- `idx_createdBy` — key

**Collection permissions:** `read("any")` + `create/update/delete("users")` + admin label.  
**Row security:** enabled — document permissions grant `read/update/delete` only to the creator. Public access to `isActive/token` is intentional for the public viewer flow; the API route further validates expiry server-side.

### 3.3 Pending Collections

#### `workspace_invitations`

| Column        | Type        | Required | Description                                   |
| ------------- | ----------- | -------- | --------------------------------------------- |
| workspaceId   | string(256) | yes      | Target workspace                              |
| inviterUserId | string(256) | yes      | Who sent the invitation                       |
| inviteeEmail  | string(256) | yes      | Email of invitee                              |
| inviteeUserId | string(256) | no       | User ID if invitee already has account        |
| role          | string(32)  | yes      | admin, editor, viewer (not owner)             |
| status        | string(32)  | yes      | pending, accepted, rejected, revoked, expired |
| expiresAt     | datetime    | yes      | Invitation expiration                         |
| acceptedAt    | datetime    | no       | When accepted                                 |
| rejectedAt    | datetime    | no       | When rejected                                 |
| revokedAt     | datetime    | no       | When revoked                                  |
| createdAt     | datetime    | yes      | Creation timestamp                            |

**Indexes:**

- `idx_invitee_email` on `inviteeEmail`
- `idx_invitee_user` on `inviteeUserId`
- `idx_workspace` on `workspaceId`
- `idx_status` on `status`

#### `notifications`

| Column    | Type         | Required | Description                       |
| --------- | ------------ | -------- | --------------------------------- |
| userId    | string(256)  | yes      | Target user                       |
| type      | string(64)   | yes      | notification type                 |
| title     | string(256)  | yes      | Notification title                |
| message   | string(1000) | yes      | Notification body                 |
| data      | string(5000) | no       | JSON payload for navigation/state |
| isRead    | boolean      | yes      | Read status                       |
| createdAt | datetime     | yes      | Creation timestamp                |
| readAt    | datetime     | no       | When marked as read               |

**Indexes:**

- `idx_user` on `userId`
- `idx_user_unread` on `userId + isRead`
- `idx_created` on `createdAt`

---

## 4. Permission Model & Access Control Rules

### 4.1 Platform-Level Rules

```typescript
// Only admin label users can access admin panel
function canAccessAdminPanel(user: User): boolean {
  return user.labels?.includes("admin") ?? false;
}

// Only admin can list all users
function canListAllUsers(user: User): boolean {
  return user.labels?.includes("admin") ?? false;
}

// Only admin can modify labels
function canModifyLabels(user: User): boolean {
  return user.labels?.includes("admin") ?? false;
}
```

### 4.2 Workspace-Level Rules

```typescript
// Role hierarchy: owner(3) > admin(2) > editor(1) > viewer(0)
const ROLE_LEVEL = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

function hasMinimumRole(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

// Workspace visibility: user can see workspaces where they are owner/member
async function canAccessWorkspace(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  // Check if user is owner
  const workspace = await getWorkspace(workspaceId);
  if (workspace.ownerId === userId) return true;

  // Check if user is member
  const membership = await getMembership(workspaceId, userId);
  return membership !== null;
}

// Only owner/admin can invite
function canInviteToWorkspace(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

// Only owner can transfer ownership or delete workspace
function canTransferOwnership(role: WorkspaceRole): boolean {
  return role === "owner";
}

// Only owner/admin can remove members or change roles
function canManageMembers(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}
```

---

## 5. Bootstrap Rule - First User Becomes Admin

### 5.1 Rule Definition

When a new user registers and there are **no users** in the system, they MUST be assigned the `admin` label automatically.

### 5.2 Implementation

**Option A: Appwrite Function triggered on user creation**

- Trigger: `users.create` event
- Check if this is the first user
- If yes, call `users.updateLabels()` to add `admin` label

**Option B: Client-side check after registration**

- After registration, check user count
- If count === 1, update labels to add `admin`

**Option C: Server-side registration via Appwrite Function**

- Create a custom registration endpoint
- Validate user count
- Assign admin label before user creation completes

### 5.3 Recommended: Option A (Appwrite Function)

```javascript
// Function: bootstrap-admin
// Trigger: Event v2 - `users.*.create`

module.exports = async (req, res) => {
  const user = req.payload;

  // List all users to check count
  const users = await sdk.users.list();

  // If this is the first user, make them admin
  if (users.total === 1) {
    await sdk.users.updateLabels(user.$id, ["admin"]);
  }

  res.json({ success: true });
};
```

---

## 6. Invitation System

### 6.1 Invitation Lifecycle

```
┌─────────────┐
│  PENDING    │ ← Initial state when invitation created
└──────┬──────┘
       │
       ├──────► ACCEPTED ────► Member added to workspace_members
       │
       ├──────► REJECTED ────► Invitation marked rejected
       │
       ├──────► REVOKED ────► Invitation cancelled by inviter
       │
       └──────► EXPIRED ────► Past expiration date
```

### 6.2 Invitation Flow

1. **Workspace owner/admin creates invitation**
   - Specify invitee email
   - Specify role (admin/editor/viewer)
   - System creates invitation record with `pending` status
   - System creates notification for invitee

2. **If invitee exists (by email):**
   - Send in-app notification
   - Optionally send email notification

3. **If invitee doesn't exist:**
   - Invitation stays pending
   - When invitee registers, system should check pending invitations

4. **Invitee responds:**
   - **Accept:** Create membership record, update invitation status
   - **Reject:** Update invitation status to `rejected`
   - **Ignore:** Invitation stays pending until expiration

### 6.3 Invitation Business Rules

- Cannot invite to `owner` role (ownership is only transferred, not invited)
- Cannot create duplicate active invitations for same email+workspace
- Only `owner` or `admin` can create invitations
- Only invitee (by email) can accept/reject
- Invitations expire after configurable period (default: 7 days)
- Inviter can revoke pending invitations

### 6.4 API Operations

```typescript
// Create invitation
async function createInvitation(
  workspaceId: string,
  inviterUserId: string,
  inviteeEmail: string,
  role: "admin" | "editor" | "viewer",
): Promise<WorkspaceInvitation>;

// Accept invitation
async function acceptInvitation(
  invitationId: string,
  userId: string,
): Promise<void>;

// Reject invitation
async function rejectInvitation(
  invitationId: string,
  userId: string,
): Promise<void>;

// Revoke invitation
async function revokeInvitation(
  invitationId: string,
  workspaceId: string,
  requesterId: string,
): Promise<void>;

// List pending invitations for user
async function getPendingInvitationsForUser(
  email: string,
): Promise<WorkspaceInvitation[]>;

// Check for existing invitation
async function hasActiveInvitation(
  workspaceId: string,
  inviteeEmail: string,
): Promise<boolean>;
```

---

## 7. Notification System

### 7.1 Notification Types

| Type                     | Title                  | Trigger                               |
| ------------------------ | ---------------------- | ------------------------------------- |
| `workspace_invitation`   | Workspace Invitation   | User invited to workspace             |
| `invitation_accepted`    | Invitation Accepted    | Invitee accepted invitation           |
| `invitation_rejected`    | Invitation Rejected    | Invitee rejected invitation           |
| `role_changed`           | Role Changed           | Member role updated                   |
| `removed_from_workspace` | Removed from Workspace | Member removed                        |
| `workspace_deleted`      | Workspace Deleted      | Workspace owner deleted workspace     |
| `ownership_transferred`  | Ownership Transferred  | Ownership transferred to another user |

### 7.2 Notification Payload Structure

```typescript
interface Notification {
  $id: string;
  userId: string; // Target user
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    workspaceId?: string;
    workspaceName?: string;
    role?: WorkspaceRole;
    inviterName?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}
```

### 7.3 Realtime Strategy

Use **Appwrite Realtime** to deliver notifications in near real-time:

```typescript
// Subscribe to user's notifications
const unsubscribe = client.subscribe(
  `databases.${DATABASE_ID}.collections.notifications.documents`,
  (response) => {
    if (response.events.includes("notifications.create")) {
      const notification = response.payload;
      if (notification.userId === currentUserId) {
        // Show toast / update notification bell
      }
    }
  },
);
```

### 7.4 Notification API

```typescript
// Create notification
async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>,
): Promise<Notification>;

// Mark notification as read
async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<void>;

// Mark all notifications as read
async function markAllAsRead(userId: string): Promise<void>;

// Get user notifications
async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<Notification[]>;

// Get unread count
async function getUnreadCount(userId: string): Promise<number>;
```

---

## 8. First-User Bootstrap Implementation

### 8.1 Strategy

Use an **Appwrite Function** that triggers on user creation events.

### 8.2 Function Code

```javascript
// File: bootstrap-admin/index.js
const sdk = require("node-appwrite");

module.exports = async (req, res) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);

  client
    .setEndpoint(req.variables["APPWRITE_FUNCTION_API_ENDPOINT"])
    .setProject(req.variables["APPWRITE_FUNCTION_PROJECT_ID"])
    .setKey(req.variables["APPWRITE_FUNCTION_API_KEY"]);

  try {
    // Only process user.create events
    if (!req.eventType?.includes("users.create")) {
      return res.json({ handled: false });
    }

    const newUserId = req.payload?.userId || req.payload?.$id;
    if (!newUserId) {
      return res.json({ handled: false });
    }

    // Check total user count
    const userList = await users.list();
    console.log("Total users:", userList.total);

    // If this is the first user, assign admin label
    if (userList.total === 1) {
      console.log("First user detected, assigning admin label...");
      await users.updateLabels(newUserId, ["admin"]);
      console.log("Admin label assigned to user:", newUserId);
      return res.json({
        handled: true,
        action: "assigned_admin_label",
        userId: newUserId,
      });
    }

    res.json({ handled: false, reason: "not_first_user" });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.json({ handled: false, error: error.message });
  }
};
```

### 8.3 Trigger Configuration

- **Event:** `users.*.create`
- **Resource:** Project
- **Timeout:** 60s
- **Memory:** 256MB

---

## 9. Admin Panel Requirements

### 9.1 Admin Panel Features

| Feature          | Description                                          |
| ---------------- | ---------------------------------------------------- |
| User List        | Paginated list of all users with email, name, labels |
| User Details     | View user metadata, labels, memberships              |
| Label Management | Add/remove labels (admin/user)                       |
| User Status      | Enable/disable user accounts                         |
| User Search      | Search users by email or name                        |

### 9.2 Route Protection

```typescript
// middleware.ts or layout guard
import { redirect } from 'next/navigation';

async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user.labels?.includes('admin')) {
    redirect('/workspace');
  }

  return <>{children}</>;
}
```

### 9.3 Admin API Endpoints (Server-side)

```typescript
// Only callable by admin users
async function listAllUsers(options?: {
  search?: string;
  limit?: number;
}): Promise<User[]>;
async function getUserById(userId: string): Promise<User>;
async function updateUserLabels(
  userId: string,
  labels: string[],
): Promise<User>;
async function updateUserStatus(userId: string, status: boolean): Promise<User>;
```

---

## 10. Security Considerations

### 10.1 Row-Level Protection

All database queries MUST filter by user membership:

```typescript
// WRONG - Don't do this
const workspaces = await listDocuments("workspaces");

// CORRECT - Always filter by membership
const memberships = await listDocuments("workspace_members", [
  Query.equal("userId", currentUserId),
]);
const workspaceIds = memberships.documents.map((m) => m.workspaceId);
const workspaces = await Promise.all(
  workspaceIds.map((id) => getDocument("workspaces", id)),
);
```

### 10.2 Server-Side Enforcement

All authorization checks MUST be enforced server-side:

```typescript
// In API routes or Appwrite Functions
async function updateWorkspace(workspaceId: string, data: any, userId: string) {
  // 1. Verify user has access
  const canEdit = await hasWorkspacePermission(workspaceId, userId, "editor");
  if (!canEdit) throw new ForbiddenError();

  // 2. Proceed with update
  return updateDocument("workspaces", workspaceId, data);
}
```

### 10.3 Never Trust the Client

```typescript
// WRONG - Client specifies their role
await addWorkspaceMember(workspaceId, userId, clientProvidedRole);

// CORRECT - Server determines role based on permissions
async function inviteMember(
  workspaceId: string,
  inviteeEmail: string,
  requestedRole: Role,
  inviterId: string,
) {
  // Verify inviter has permission
  const inviterRole = await getMemberRole(workspaceId, inviterId);
  if (!canInvite(inviterRole)) throw new ForbiddenError();

  // Server determines actual role (can't invite above your own)
  const role = min(inviterRole, requestedRole);
  // ...
}
```

---

## 11. Edge Cases

| Edge Case                                      | Handling                                                  |
| ---------------------------------------------- | --------------------------------------------------------- |
| User deletes account while invitations pending | Revoke all pending invitations for that email             |
| Owner leaves workspace                         | Ownership must be transferred first                       |
| Last admin removed from workspace              | At least one admin must remain (or workspace is orphaned) |
| User invited but email already member          | Return error: "User is already a member"                  |
| Duplicate invitation                           | Check for existing pending invitation before creating     |

---

## 12. Auth State Architecture

### 12.1 Single-Source AuthContext

Auth state is managed by a single `AuthProvider` in `src/contexts/auth-context.tsx`, mounted once in the root layout. All components consume it through `useAuth()` (a thin proxy to `useAuthContext()`).

**Why this matters:** Mounting auth logic inside individual hooks caused `getCurrentUser()` to be called multiple times per route (React StrictMode mounts effects twice; multiple hook consumers triggered redundant requests). Centralizing it in a context provider means exactly one `getCurrentUser()` call per app lifecycle.

```
src/app/layout.tsx
  └─ <AuthProvider>          ← single getCurrentUser() on mount
       └─ <WorkspaceProvider>
            └─ {children}
```

### 12.2 StrictMode Safety

React StrictMode (enabled by default in Next.js dev) mounts → unmounts → remounts effects. The auth effect sets `mountedRef.current = true` as its **first** statement so the cleanup can flip it to `false`, and the remount resets it immediately — preventing stale async callbacks from writing to unmounted state.

```typescript
useEffect(() => {
  mountedRef.current = true; // ← must be FIRST line
  // ... async getCurrentUser() ...
  return () => {
    mountedRef.current = false;
  };
}, []);
```

---

## 13. Public Share Link Access

Share links allow **unauthenticated** viewers to see a board's content in read-only mode. This is intentionally scoped and does not give access to any authenticated feature.

### 13.1 What a share link grants

- Read access to the board's name, dimensions, background
- Read access to layers and items for that specific board
- Read access to individual storage files (images) used in that board — proxied server-side
- **Nothing else**: no workspace data, no member list, no other boards, no write operations

### 13.2 Threat model

| Threat                              | Mitigation                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Leaked token gives permanent access | Links support `expiresAt` and can be revoked (`isActive = false`)               |
| Token brute force                   | UUID v4 token = 2¹²² search space; rate limiting at infra level                 |
| API key exposed                     | Key is server-only (`src/lib/appwrite/server-client.ts`); never sent to browser |
| Viewer escalates to write           | API routes return only read data; no write endpoints exist on the share path    |
| Storage files scraped               | Files are served via proxy, not direct Appwrite URLs; bucket is `read("users")` |

### 13.3 Share link capabilities matrix

| Capability                            | Authenticated user                                   | Share link viewer |
| ------------------------------------- | ---------------------------------------------------- | ----------------- |
| View board content                    | ✅                                                   | ✅ (read-only)    |
| Edit board content                    | ✅ (role-dependent)                                  | ❌                |
| View workspace info                   | ✅                                                   | ❌                |
| Download assets                       | ✅                                                   | Via proxy only    |
| Create/revoke share links             | ✅ (own links)                                       | ❌                |
| Invitation for non-existent workspace | Validate workspace exists before creating invitation |
| Expired invitation acceptance         | Return error: "Invitation has expired"               |
| Self-invitation prevention            | Cannot invite yourself to a workspace                |
| Role downgrade from owner             | Only ownership transfer, not role change             |

---

## 12. Implementation Plan

### Phase 1: Database Changes

- [ ] Create `workspace_invitations` table
- [ ] Create `notifications` table
- [ ] Add composite index on `workspace_members`

### Phase 2: TypeScript Types

- [ ] Create `src/types/platform.ts` (PlatformLabel, PlatformUser)
- [ ] Create `src/types/invitation.ts` (InvitationStatus, WorkspaceInvitation)
- [ ] Create `src/types/notification.ts` (NotificationType, Notification)
- [ ] Update `src/types/workspace.ts` with extended types

### Phase 3: Services

- [ ] Create `src/services/platform-admin-service.ts`
- [ ] Create `src/services/invitation-service.ts`
- [ ] Create `src/services/notification-service.ts`
- [ ] Update `src/services/workspace-service.ts`

### Phase 4: Hooks & Contexts

- [ ] Create `src/hooks/use-platform-admin.ts`
- [ ] Create `src/hooks/use-invitations.ts`
- [ ] Create `src/hooks/use-notifications.ts`
- [ ] Update `src/hooks/use-auth.ts`

### Phase 5: UI Components

- [ ] Create `src/components/admin/` (admin user list, user detail)
- [ ] Create `src/components/invitations/` (invite modal, invitation list)
- [ ] Create `src/components/notifications/` (notification bell, notification list)
- [ ] Create `src/app/admin/page.tsx`

### Phase 6: Appwrite Function

- [ ] Create `bootstrap-admin` function for first-user admin assignment

### Phase 7: Testing & Documentation

- [ ] Test invitation flow
- [ ] Test notification delivery
- [ ] Test admin panel access control
- [ ] Update documentation
