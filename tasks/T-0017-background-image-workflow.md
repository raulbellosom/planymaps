# T-0017 - Implement background image workflow

## Metadata

- ID: `T-0017`
- Phase: `Phase 4`
- Block: `Block 2`
- Status: `todo`
- Last updated: `2026-04-18`
- Responsible agent: `Roo Code / MiniMax M2.7`

## Objective

Allow a board to use an uploaded image as a background with correct rendering, persistence, and replacement flow.

## Scope

- Select an uploaded asset as the board background.
- Render the background image beneath visual layers.
- Persist background selection on the board.
- Add replace and remove background actions.
- Ensure the background is not mistakenly treated as a normal editable shape unless intentionally modeled that way.

## Out of scope

- Full georeferencing.
- Map mode.

## Dependencies

- `T-0006`
- `T-0008`

## Acceptance criteria

- [ ] A board can use an image background.
- [ ] Background assignment persists.
- [ ] Background replacement works.
- [ ] Background rendering does not break layer interactions.

## Validations

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Tests

- Assign a background image and reload the board.
- Replace the background image and verify persistence.
- Remove the background and verify fallback behavior.

## Risks

- Risk of background image sizing inconsistency.
- Risk of confusing background assets with normal layer items.

## Documentation to update

- `docs/01-product-overview.md`
- `docs/06-maps-geolocation.md`

## Key decisions

- Background images are a core first-release requirement because they unlock layout annotation before map mode exists.

## Evidence

- Code paths changed
- Validation output
- Screenshots or short verification notes when relevant

## Next task

- `T-0018`

## Unresolved items

- None at task creation time.
