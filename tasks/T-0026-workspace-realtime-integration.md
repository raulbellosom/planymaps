# T-0026: Workspace & Realtime Integration

## Metadata

- **Created**: 2026-04-19
- **Priority**: High
- **Status**: Pending

## Scope

### What's implemented (partial)

- Auth UI: `/login`, `/register` pages
- Workspace service: CRUD operations in `src/services/workspace-service.ts`
- Realtime service: `src/lib/realtime/realtime-service.ts`
- Workspace context: `src/contexts/workspace-context.tsx` (TODO items)

### What's missing (TBD after investigation)

## Investigation Tasks

1. **Workspace Creation UI**
   - `src/app/workspace/page.tsx` has create button but handler is TODO
   - Need to connect to `createWorkspace()` from workspace-service

2. **Workspace List**
   - Context has `refreshWorkspaces()` as TODO
   - Need to connect to `listUserWorkspaces()` from workspace-service

3. **User Invitation UI**
   - Service has `addWorkspaceMember()`
   - Need to create invite modal/UI

4. **Realtime Connection**
   - Service exists but may not be connected to board updates
   - Need to verify subscription setup in board page

## Acceptance Criteria

1. User can create a workspace from UI
2. User sees list of their workspaces
3. User can invite members by email
4. Board changes sync in realtime (visual verification)

## Validations

- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm build` passes
