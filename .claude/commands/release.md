---
description: Bump version, commit, tag, and push to trigger a release build
---

# Release

Bump the version in tauri.conf.json, commit it, create a git tag, and push to trigger the GitHub Actions release workflow.

## Step 1: Check working directory is clean

```bash
git status --porcelain
```

If there are uncommitted changes, stop and ask the user to commit or stash them first.

## Step 2: Read the current version

Read `src-tauri/tauri.conf.json` and extract the `version` field. Show it to the user.

## Step 3: Ask for version bump type

Ask the user which version bump they want:
- **patch**: 0.1.0 → 0.1.1 (bug fixes)
- **minor**: 0.1.0 → 0.2.0 (new features)
- **major**: 0.1.0 → 1.0.0 (breaking changes)

Or let them specify an exact version.

## Step 4: Update the version

Edit `src-tauri/tauri.conf.json` to set the new version number.

## Step 5: Commit the version bump

```bash
git add src-tauri/tauri.conf.json
git commit -m "Bump version to <NEW_VERSION>"
```

## Step 6: Create and push the tag

```bash
git tag v<NEW_VERSION>
git push origin main v<NEW_VERSION>
```

Push both the commit and the tag together.

## Step 7: Report

Tell the user:
- The new version (e.g., `v0.2.0`)
- That the GitHub Actions release workflow should now be running
- They can check progress at the repo's Actions tab
