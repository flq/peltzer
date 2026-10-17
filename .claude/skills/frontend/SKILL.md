---
name: frontend
description: Use when creating or editing any Svelte component or CSS in this project — points to the design tokens, shared components and icons to reuse, and sets the testing expectations for new UI features.
---

# Frontend Implementation Checklist

Before writing UI code, read the current design vocabulary from its source so you reuse it instead of reinventing it.

## Where to look

- **Tokens and utility classes:** `src/styles.css`
- **Shared components:** every file in `src/components/`
- **Icons already in use:** `grep -rh 'from "@lucide/svelte"' src/ --include="*.svelte" | sort -u`

## Rules

- Never hard-code a value that a token already covers.
- Use a shared component before writing a common element from scratch. If new UI is self-contained and reusable, put it in `src/components/`.
- Prefer icons already in use; add new ones only when nothing fits.

## Tests

New features need tests in the matching `__tests__/` folder (see `CLAUDE.md` for conventions), unless the feature is purely user interactivity.

- Test behaviour with an observable outcome, e.g. a copy button writes to the clipboard.
- Skip pure interaction mechanics, e.g. a resize divider.

Finish with `/verify`.
