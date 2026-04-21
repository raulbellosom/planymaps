# 07 - Appwrite Backend Guidelines

## Appwrite responsibilities

Use Appwrite for:

- authentication
- account management
- workspace membership
- board persistence
- layer/item persistence
- asset storage
- realtime subscriptions
- secure server-side functions when needed

## Proposed resource boundaries

### Collections / Tables

- workspaces
- workspace_members
- boards
- board_layers
- board_items
- board_assets
- board_versions
- board_comments (optional future)
- **share_links** ← added for public board sharing

### Storage buckets

- board_assets (for uploaded images/files, max 30MB)
- board_thumbnails (for generated thumbnails, max 2MB)
- board_exports (optional future)
- avatars (for user profile pictures, max 10MB)

## Permissions model

Permissions must be applied at:

- workspace level
- board level
- asset level when required

Use role-based access that maps to:

- owner
- admin
- editor
- viewer

## Function usage policy

Use Appwrite Functions when:

- a mutation affects several records
- asset processing is required
- permissions need stronger server-side enforcement
- version snapshots are created
- EXIF extraction or metadata normalization is centralized

## Realtime policy

Start with Appwrite Realtime for:

- board metadata changes
- layer changes
- item changes
- presence-adjacent updates if acceptable

If collaboration later requires finer grained operational sync, evaluate a secondary collaboration layer without discarding Appwrite as the main backend.

## Validation policy

Validate data:

- on the client before request submission
- on the server or function boundary before persistence
- at the schema level where possible

## Deletion policy

Prefer soft delete for board items and boards where recovery matters.

## Authentication UI

The following auth UI pages are implemented:

- `/login` - Login page with email/password form validation
- `/register` - Registration page with password strength indicator

Auth state is managed via `useAuth()` hook in `src/hooks/use-auth.ts`.

Appwrite Auth handles users, sessions, and providers automatically. OAuth providers (Google, GitHub, etc.) can be configured in the Appwrite Console under Auth > Settings.

## Collection Permissions Setup

Permissions are managed via `appwrite.config.json` and deployed with `appwrite push tables` / `appwrite push buckets`. **Do not configure permissions manually in the console** — the CLI is the source of truth.

### Collection-level permissions summary

| Collection              | `rowSecurity` | Collection `$permissions`                                   |
| ----------------------- | ------------- | ----------------------------------------------------------- |
| `notifications`         | **true**      | read/create/update/delete(`users`) + admin label            |
| `workspaces`            | **true**      | read/create/update/delete(`users`) + admin label            |
| `workspace_members`     | **true**      | read/create/update/delete(`users`) + admin label            |
| `workspace_invitations` | false         | read/create/update/delete(`users`) + admin label            |
| `boards`                | false         | read/create/update/delete(`users`) + admin label            |
| `board_layers`          | false         | read/create/update/delete(`users`) + admin label            |
| `board_items`           | false         | read/create/update/delete(`users`) + admin label            |
| `board_assets`          | false         | read/create/update/delete(`users`) + admin label            |
| `share_links`           | **true**      | `read("any")` + create/update/delete(`users`) + admin label |

When `rowSecurity` is `true`, collection-level permissions grant access to the collection itself but individual document access is gated by document-level `$permissions` set at creation time by the service layer.

### Document-level permissions

Services pass a `$permissions` array on every `createDocument` call:

```typescript
// Example: workspace owned by a user
[
  Permission.read(Role.user(ownerId)),
  Permission.update(Role.user(ownerId)),
  Permission.delete(Role.user(ownerId)),
  Permission.read(Role.label("admin")),
  Permission.update(Role.label("admin")),
  Permission.delete(Role.label("admin")),
];
```

Services that set document-level permissions:

- `notification-service.ts` — per-user notifications
- `workspace-service.ts` — workspace + membership documents; also dynamically patches workspace `$permissions` when a member is added/removed
- `asset-service.ts` — storage file permissions + `board_assets` document permissions

### Storage bucket permissions

| Bucket             | `fileSecurity` | Bucket `$permissions`                                         |
| ------------------ | -------------- | ------------------------------------------------------------- |
| `avatars`          | true           | `read("any")` + create/update/delete(`users`) + admin label   |
| `board_thumbnails` | true           | `read("users")` + create/update/delete(`users`) + admin label |
| `board_assets`     | true           | `read("users")` + create/update/delete(`users`) + admin label |

`board_thumbnails` and `board_assets` are **not** publicly readable — they require an authenticated session or the server API key (used by the asset proxy route for share links).

### Server-side Appwrite client

`src/lib/appwrite/server-client.ts` provides a Node.js-only Appwrite client authenticated with the `APPWRITE_API_KEY` environment variable. It bypasses row security and session auth entirely. **Never import this in client components.**

```typescript
import {
  getServerDatabases,
  getServerStorage,
} from "@/lib/appwrite/server-client";
```

Use this client only in Next.js Route Handlers (`src/app/api/`) or Server Components that need to read data on behalf of unauthenticated users (e.g., the public share link API).

## Public Share Link Feature

Authenticated users can share a board as a read-only public link without requiring the viewer to sign in.

### Architecture

```
Browser (anonymous)
  └─► GET /share/[token]            Next.js server page
        └─► GET /api/share/[token]  Route Handler (server API key)
              ├─► Appwrite share_links collection (validate token)
              ├─► Appwrite boards collection
              ├─► Appwrite board_layers collection
              └─► Appwrite board_items collection
                  Returns: { board, layers, items } (permissions stripped)

  └─► GET /api/share/[token]/asset/[fileId]  Asset proxy route
        ├─► Validates token (same as above)
        └─► Proxies file from Appwrite Storage using server API key
            Returns: raw file bytes with correct Content-Type
```

### Key files

| File                                                | Purpose                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/app/api/share/[token]/route.ts`                | Board data API — validates token, returns `{ board, layers, items }`                             |
| `src/app/api/share/[token]/asset/[fileId]/route.ts` | Asset proxy — streams storage file to unauthenticated caller                                     |
| `src/services/share-service.ts`                     | Authenticated CRUD: `createShareLink`, `revokeShareLink`, `listBoardShareLinks`, `buildShareUrl` |
| `src/app/share/[token]/page.tsx`                    | Public viewer page (server component)                                                            |
| `src/components/editor/read-only-canvas.tsx`        | Konva stage in read-only mode; rewrites image src to use asset proxy                             |
| `src/components/editor/share-modal.tsx`             | Share management UI (create, copy, revoke links)                                                 |

### Security properties

- The server API key is **never** sent to the browser — the proxy fetches assets server-side.
- Expired links (`expiresAt < now`) return HTTP 410.
- Revoked links (`isActive === false`) return HTTP 410.
- Row security on `share_links` ensures only the creator can list/revoke their own links.
- Board asset buckets remain `read("users")` — unauthenticated access goes only through the validated proxy.
