# Peltzer - Gremlin Database Browser

A Tauri desktop application for connecting to and querying Gremlin graph databases (JanusGraph, Azure CosmosDB, TinkerPop Server).

## Project Structure

```
peltzer/
├── src/                    # Frontend (TypeScript)
│   ├── main.ts            # App entry, UI wiring
│   ├── connection.ts      # Connection API + store persistence
│   ├── query.ts           # Query execution API
│   ├── types.ts           # Shared types (ConnectionConfig)
│   └── styles.css         # Dark theme, two-pane layout
├── src-tauri/             # Backend (Rust)
│   ├── src/
│   │   ├── lib.rs         # Tauri setup, command registration
│   │   ├── connection.rs  # Connection manager, connect/disconnect commands
│   │   └── query.rs       # Query execution, GValue to JSON conversion
│   ├── Cargo.toml         # Rust dependencies
│   └── capabilities/      # Tauri permissions
└── index.html             # App shell
```

## Tech Stack

- **Frontend**: TypeScript, Vite, vanilla DOM (no framework)
- **Backend**: Rust, Tauri v2, gremlin-client, tokio
- **Persistence**: tauri-plugin-store (connections.json)

## Commands

```bash
# Development
npm run tauri dev

# Build
npm run build              # Frontend only
cd src-tauri && cargo build  # Backend only
npm run tauri build        # Full app bundle

# Tests (when added)
npm test                   # Frontend tests (Vitest)
cd src-tauri && cargo test # Rust tests
```

## Architecture Decisions

### Connection Management
- Connections stored via tauri-plugin-store in `connections.json`
- Single active connection held in Rust app state (`SharedConnectionState`)
- Credentials stored in plain JSON (acceptable for local dev tool)

### Query Execution
- Raw Gremlin queries sent to backend via `execute_query` command
- Results converted from `GValue` to JSON for display
- Async execution using tokio runtime

### Supported Databases
- JanusGraph (WebSocket, optional auth)
- Azure CosmosDB Gremlin API (host, username, primary key)
- TinkerPop Server (local dev, typically no auth)

## Testing Strategy

### Current State
No tests yet. Add as complexity grows.

### Frontend Testing (Vitest)
```bash
npm install -D vitest jsdom @tauri-apps/api
```

Use `@tauri-apps/api/mocks` to mock IPC calls:
```typescript
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";

mockIPC((cmd, args) => {
  if (cmd === "execute_query") {
    return JSON.stringify([{ type: "vertex", id: 1, label: "person" }]);
  }
});
```

### Rust Testing
Add to `src-tauri/Cargo.toml`:
```toml
[dev-dependencies]
tauri = { version = "2", features = ["test"] }
```

Test pure functions (GValue conversion, connection options building) with standard `#[test]`.

### E2E Testing
WebDriver via `tauri-driver` works on **Windows and Linux only** (no macOS support - no WKWebView driver). Not a priority for local development.

## Verification

After making code changes, run `/verify` to check builds and tests.

The `/verify` command will:
1. Build TypeScript frontend (`npm run build`)
2. Build Rust backend (`cargo build`)
3. Run tests if configured (`npm test`, `cargo test`)

For manual testing: `npm run tauri dev` to launch the app.

## Future Features (Planned)

- [ ] Docker dev environment (TinkerPop Gremlin Server for local testing)
- [ ] Query history with persistence
- [ ] Graph visualization
- [ ] Schema/metadata exploration
- [ ] Export results (CSV, JSON)
- [ ] Multiple query tabs
- [ ] Syntax highlighting for Gremlin
