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

## Reporting

After all steps complete (TypeScript build, Rust build, frontend tests, Rust tests), report:
- **Success**: "All checks passed" with a summary of what was verified
- **Failure**: Which step failed, the error message, and suggested fix

If any step fails, do NOT proceed with other tasks until the issue is resolved.
