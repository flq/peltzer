---
description: Build and verify the project compiles correctly. Run after making code changes.
---

# Verify Build

Run the following verification steps in sequence. Stop and report if any step fails.

## Step 1: TypeScript Build

```bash
npm run build
```

This compiles TypeScript and bundles the frontend. Check for:
- Type errors
- Import/export issues
- Missing dependencies

## Step 2: Rust Build

```bash
cargo build --manifest-path src-tauri/Cargo.toml
```

This compiles the Rust backend. Check for:
- Compilation errors
- Borrow checker issues
- Missing dependencies

## Step 3: Frontend Tests

```bash
npm test
```

Run the Vitest test suite for Svelte components. Check for:
- Failing test assertions
- Component rendering issues
- Mock/stub problems

## Step 4: Rust Tests

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Run the Rust test suite. Check for:
- Failing test assertions
- Integration test failures

## Step 5: Visual Verification (conditional)

**Only run this step if changes touched files in `src/components/` or `src/lib/`.**

1. Start the mock dev server in the background:
   ```bash
   npm run dev:mock
   ```
2. Wait a few seconds for the server to be ready, then use Playwright MCP tools to:
   - Navigate to `http://localhost:1430`
   - Verify the Connections page renders (heading visible, seed connection listed)
   - Click the "Local TinkerPop" connection to connect
   - Execute the default query via the Execute button
   - Take a screenshot and check for:
     - Broken layout or missing elements
     - Results displaying correctly (formatted JSON with 3 results)
     - Console errors (via `browser_console_messages`, ignore favicon 404)
3. Close the browser and stop the background dev server.

If visual issues are found, report them with the screenshot.

## Reporting

After all steps complete, report:
- **Success**: "All checks passed" with a summary of what was verified (include whether visual verification ran)
- **Failure**: Which step failed, the error message, and suggested fix

If any step fails, do NOT proceed with other tasks until the issue is resolved.
