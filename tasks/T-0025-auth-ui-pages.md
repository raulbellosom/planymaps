# T-0025: Auth UI Pages

## Metadata

- **Created**: 2026-04-19
- **Priority**: High
- **Status**: Pending

## Scope

### In scope

- Login page (`/login`) with email/password form
- Register page (`/register`) with email/password/name form
- Form validation (email format, password strength)
- Error handling and display
- Loading states
- Link between login/register pages
- Auth hook for managing auth state

### Out of scope

- OAuth providers (configured in Appwrite Console)
- Password reset UI (can be added later)
- Session management UI
- Protected routes (next task)

## Dependencies

- T-0003: Appwrite Backend Scaffold (auth service already exists)

## Acceptance criteria

1. **Login Page** (`/login`)
   - Email input with validation
   - Password input
   - Submit button with loading state
   - Error message display
   - Link to register page
   - Redirect to workspace page on success

2. **Register Page** (`/register`)
   - Name input (optional)
   - Email input with validation
   - Password input with strength indicator
   - Confirm password input
   - Submit button with loading state
   - Error message display
   - Link to login page
   - Redirect to workspace page on success

3. **Validation**
   - Email must be valid format
   - Password minimum 8 characters
   - Passwords must match on register

4. **Auth Hook** (`useAuth`)
   - `user` - current user or null
   - `isLoading` - auth state loading
   - `isAuthenticated` - boolean
   - `login(email, password)` function
   - `register(email, password, name?)` function
   - `logout()` function

## Validations

- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm build` passes

## Documentation to update

- docs/07-appwrite-backend.md - Note that auth UI pages are now implemented
