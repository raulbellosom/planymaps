# 04 - Data Model

## Modeling goals

The data model must support:

- multiple workspaces
- multiple boards
- layers
- ordered items within layers
- object-level and layer-level visibility/locking/opacity
- grouping
- image backgrounds
- future geo-aware content

## Primary entities

### Workspace

Suggested fields:

- id
- name
- slug
- ownerId
- createdAt
- updatedAt
- archivedAt

### WorkspaceMember

Suggested fields:

- id
- workspaceId
- userId
- role
- createdAt

### Board

Suggested fields:

- id
- workspaceId
- name
- description
- mode (`visual` | `geo`)
- width
- height
- backgroundType (`none` | `color` | `image` | `map`)
- backgroundColor
- backgroundAssetId
- viewportState
- isArchived
- createdBy
- createdAt
- updatedAt

### Layer

Suggested fields:

- id
- boardId
- name
- orderIndex
- visible
- locked
- opacity
- blendMode
- createdAt
- updatedAt

### BoardItem

Suggested fields:

- id
- boardId
- layerId
- parentGroupId
- type
- name
- orderIndex
- visible
- locked
- opacity
- x
- y
- width
- height
- rotation
- scaleX
- scaleY
- styleJson
- contentJson
- interactionJson
- geoJson
- createdBy
- createdAt
- updatedAt
- deletedAt

### Asset

Suggested fields:

- id
- workspaceId
- boardId
- storageFileId
- fileName
- mimeType
- width
- height
- sizeBytes
- thumbnailFileId
- exifJson
- gpsLat
- gpsLng
- uploadedBy
- createdAt

### BoardVersion

Suggested fields:

- id
- boardId
- versionNumber
- summary
- snapshotRef
- createdBy
- createdAt

## Object types

Planned initial item types:

- rectangle
- ellipse
- line
- arrow
- path
- text
- image
- pin
- group

## Serialization rule

Persist board content as normalized records where practical, not as one giant opaque JSON document.

## Future geo support

`geoJson` on `BoardItem` should allow future support for:

- point
- line string
- polygon

---

## ShareLink

Enables public, unauthenticated read access to a board via a secret token URL.

### Fields

| Field       | Type        | Required | Description                         |
| ----------- | ----------- | -------- | ----------------------------------- |
| token       | string(64)  | yes      | Unique URL-safe token (UUID v4)     |
| boardId     | string(256) | yes      | Target board                        |
| workspaceId | string(256) | yes      | Owning workspace                    |
| createdBy   | string(256) | yes      | User ID who created the link        |
| label       | string(256) | no       | Optional human-readable description |
| expiresAt   | datetime    | no       | Null = never expires                |
| isActive    | boolean     | yes      | False = revoked                     |

### Indexes

- `idx_token` — **unique** on `token` (fast lookup per public request)
- `idx_boardId` — key on `boardId` (list links per board)
- `idx_createdBy` — key on `createdBy` (list links per user)

### Access pattern

Public viewer hits `/share/[token]` → Next.js server component calls `/api/share/[token]` → API route uses server API key to look up the token, validates `isActive` and `expiresAt`, then returns `{ board, layers, items }` stripped of permission metadata. Assets are proxied through `/api/share/[token]/asset/[fileId]` using the same API key. No Appwrite session is required for any of these operations.

### Expiry options

| Option | Duration |
| ------ | -------- |
| `1d`   | 24 hours |
| `7d`   | 7 days   |
| `30d`  | 30 days  |
| `null` | Never    |
