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

## Step 2: Check gremlin-client dependency

Read `src-tauri/Cargo.toml` and check the `gremlin-client` dependency. It must use the git reference (`git = "https://github.com/flq/gremlin-rs"`), not a local path. If it's using a local path, switch it to:

```
gremlin-client = { git = "https://github.com/flq/gremlin-rs", branch = "peltzer-support", features = ["tokio-runtime"] }
```

If you made a change, commit it (along with `Cargo.lock`) before proceeding.

## Step 3: Read the current version

Read `src-tauri/tauri.conf.json` and extract the `version` field. Show it to the user.

## Step 4: Ask for version bump type

Ask the user which version bump they want:
- **patch**: 0.1.0 → 0.1.1 (bug fixes)
- **minor**: 0.1.0 → 0.2.0 (new features)
- **major**: 0.1.0 → 1.0.0 (breaking changes)

Or let them specify an exact version.

## Step 5: Update the version

Edit `src-tauri/tauri.conf.json` to set the new version number.

## Step 6: Commit the version bump

```bash
git add src-tauri/tauri.conf.json
git commit -m "Bump version to <NEW_VERSION>"
```

## Step 7: Suggest release notes

Get the commits since the last tag:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

If there are no previous tags, use all commits: `git log --oneline`.

Read the commit messages and write a short human-readable summary — 2–5 bullet points in plain English, e.g.:
- "Introduced query history panel"
- "Fixed connection timeout on reconnect"

Avoid technical jargon and git commit IDs. Show the suggested notes to the user and ask them to confirm or edit before continuing.

## Step 8: Create an annotated tag and push

Create an annotated tag with the confirmed release notes embedded as the tag message:

```bash
git tag -a v<NEW_VERSION> -m "<CONFIRMED_RELEASE_NOTES>"
git push origin main v<NEW_VERSION>
```

Push both the commit and the tag together. The GitHub Actions workflow will extract the tag annotation and use it as the release body automatically — no further steps needed.

## Step 9: Report

Tell the user:
- The new version (e.g., `v0.2.0`)
- That the GitHub Actions release workflow is running and will use the tag annotation as the release notes
- They can review and publish the draft at the repo's Releases page
