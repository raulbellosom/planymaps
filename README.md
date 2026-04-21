# Planymaps - Collaborative Canvas

A real-time collaborative canvas for teams with Canva/Figma-like editing, mobile-first touch gestures, layered composition, image annotations, and geolocated pins.

## Tech Stack

- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Editor**: react-konva / Konva, Zustand, dnd-kit
- **Backend**: Appwrite (Auth, Databases, Storage, Realtime, Functions)

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── boards/            # Board pages
│   ├── workspace/         # Workspace pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── editor/            # Editor components (Konva-based)
│   └── ui/                # Shared UI components
├── lib/
│   └── appwrite/          # Appwrite SDK initialization
├── services/               # Business logic services
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── types/                  # TypeScript type definitions
└── env.ts                  # Environment variable helpers

docs/                       # Detailed architecture documentation
tasks/                      # Sequenced implementation tasks
plans/                      # Execution plans
```

## Quick Start

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your Appwrite credentials:

   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://aprod.racoondevs.com/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=planymaps
   APPWRITE_API_KEY=your_api_key_here
   ```

3. **Run development server**:

   ```bash
   pnpm dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Validation Commands

```bash
pnpm install    # Install dependencies
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type checking
pnpm build      # Build for production
```

## Documentation

- [START-HERE.md](START-HERE.md) - Minimal execution path
- [docs/01-product-overview.md](docs/01-product-overview.md) - Product overview
- [docs/02-system-architecture.md](docs/02-system-architecture.md) - Architecture
- [docs/03-tech-stack.md](docs/03-tech-stack.md) - Tech stack decisions
- [docs/04-data-model.md](docs/04-data-model.md) - Data model
- [docs/05-editor-interaction-model.md](docs/05-editor-interaction-model.md) - Editor interactions
- [docs/06-maps-geolocation.md](docs/06-maps-geolocation.md) - Maps and geolocation
- [docs/07-appwrite-backend.md](docs/07-appwrite-backend.md) - Appwrite backend
- [docs/08-realtime-strategy.md](docs/08-realtime-strategy.md) - Realtime strategy
- [docs/09-ai-agent-operating-rules.md](docs/09-ai-agent-operating-rules.md) - AI agent rules
- [docs/10-definition-of-done.md](docs/10-definition-of-done.md) - Completion criteria

## Task Execution Order

See [tasks/INDEX.md](tasks/INDEX.md) for the complete task list.

Recommended execution:

1. T-0001 - Project bootstrap (this step)
2. T-0002 - App shell and layout foundation
3. T-0003 - Appwrite project and backend scaffolding
4. ...continue sequentially through all tasks

## MCP Appwrite Configuration

The MCP server is configured in:

```
c:/Users/raulb/AppData/Roaming/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json
```

Current configuration:

- Project ID: `planymaps`
- Endpoint: `https://aprod.racoondevs.com/v1`

## Notes for AI Agents

- Do not skip architecture docs. Tasks assume conventions defined in `docs/`.
- The goal is a maintainable, extensible product foundation, not a quick prototype.
- Execute one task at a time with validation after each.
- Keep documentation updated with meaningful architectural changes.
