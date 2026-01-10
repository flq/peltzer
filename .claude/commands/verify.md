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
cd src-tauri && cargo build
```

This compiles the Rust backend. Check for:
- Compilation errors
- Borrow checker issues
- Missing dependencies

## Step 3: Run Tests (if they exist)

Check if tests exist and run them:

**Frontend tests:**
```bash
npm test 2>/dev/null || echo "No frontend tests configured"
```

**Rust tests:**
```bash
cd src-tauri && cargo test
```

## Reporting

After all steps complete, report:
- **Success**: "All checks passed" with a summary of what was verified
- **Failure**: Which step failed, the error message, and suggested fix

If the build fails, do NOT proceed with other tasks until the issue is resolved.
