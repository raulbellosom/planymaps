# AGENTS.md — Debug Mode

This file provides debugging-specific guidance for agents working in this repository.

## Debugging Tools

- **Dirty-item tracking**: Items with pending local changes are marked "dirty" via `src/lib/dirty-items.ts`. Dirty items expire after 5 seconds. Check `isItemDirty(id)` if remote updates aren't applying.
- **Realtime events**: Appwrite realtime has NO server-side filtering — all filtering is client-side. If events from wrong boards appear, the subscription isn't being properly filtered by boardId.
- **Feedback loop detection**: `isApplyingRemote()` flag prevents remote→local→remote loops. Check `globalThis.__realtimeApplying` for debugging.

## Common Issues

1. **Snap-back on drag**: Item was marked dirty but clearItemDirty wasn't called after persistence, or the dirty flag expired before the update completed.
2. **Remote updates not appearing**: Subscription may be filtered incorrectly, or the boardId in the payload doesn't match the subscribed board.
3. **Permission errors**: Appwrite document permissions use `read("users")` — user must be authenticated. Check collection `$permissions` in `appwrite.config.json`.
4. **Stale state after navigation**: `unsubscribeAll()` may not have been called on unmount, leaving stale subscriptions active.

## Logging Locations

- Realtime events: `src/lib/realtime/realtime-service.ts` console logs
- Board store mutations: Zustand actions log via store methods
- Dirty items: `src/lib/dirty-items.ts` — `isItemDirty()` returns false after 5s expiry

## Env Validation

- Client env validated via `validatePublicEnv()` at app init
- Server env validated via `validateServerEnv()` in API routes
- Missing vars throw early at startup — no silent failures
