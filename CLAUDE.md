# Peltzer - Gremlin Database Browser

A Tauri desktop application for connecting to and querying Gremlin graph databases.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (Svelte 5)                 │
│         src/components/, src/lib/                   │
│                                                     │
│  • Components own local UI state where possible     │
│  • Shared state (connections) in Svelte stores      │
│  • API layer wraps Tauri invoke() calls             │
└─────────────────────────────────────────────────────┘
                         │ Tauri IPC (invoke)
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Backend (Rust)                      │
│                   src-tauri/src/                    │
│                                                     │
│  • Connection manager (single active connection)    │
│  • Query executor (Gremlin → JSON results)          │
│  • Config persistence (tauri-plugin-store)          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              Gremlin Database Server
        (JanusGraph, CosmosDB, TinkerPop)
```

## Tech Stack

- **Frontend**: Svelte 5, TypeScript, Vite
- **Backend**: Rust, Tauri v2, gremlin-client (tokio-runtime)
- **Persistence**: tauri-plugin-store
- **Testing**: Vitest + @testing-library/svelte (frontend), cargo test (backend)

## Commands

```bash
npm run tauri dev      # Development with hot reload
npm run build          # Frontend build
npm test               # Frontend tests
cd src-tauri && cargo build   # Backend build
cd src-tauri && cargo test    # Backend tests
```

Use `/verify` after code changes to run all builds and tests.

### Visual Dev Mode

```bash
npm run dev:mock       # Frontend with mocked Tauri backend (no Rust needed)
```

Runs the Svelte frontend on `http://localhost:1430` with all Tauri APIs replaced by in-memory mocks (`src/lib/mock-tauri.ts`). The app loads with a seed "Local TinkerPop" connection and returns canned query results.

Use this together with the Playwright MCP server (configured in `.mcp.json`) to visually inspect the UI in a real browser — useful for catching layout issues that unit tests miss. Start `npm run dev:mock`, then use Playwright MCP tools to navigate to `http://localhost:1430` and interact with the page.

## Code Guidelines

- **Comments explain why, not what** - Don't write comments that repeat what the code does. Comments should explain intent, tradeoffs, or non-obvious behavior.
- **Avoid over-engineering** - Solve the current problem simply. Don't add abstractions for hypothetical future requirements.

## Key Patterns

### State Management
- Connection state (saved connections, active connection, connection status) lives in Svelte stores (`src/lib/stores.ts`)
- UI-only state (query text, results, loading) stays local to components
- Prefer props and events over global stores for component communication

### Tauri IPC
- Frontend calls backend via `invoke("command_name", { args })`
- API functions in `src/lib/api.ts` wrap invoke calls with proper typing
- Backend commands defined with `#[tauri::command]` in Rust

### Testing
- Component tests use `@testing-library/svelte` with jsdom
- Mock Tauri APIs in `src/test/setup.ts`
- Test files live in `__tests__` subfolder: `src/components/__tests__/Component.test.ts`

## Supported Databases

- JanusGraph (WebSocket, optional auth)
- Azure CosmosDB Gremlin API
- TinkerPop Server (local dev)
