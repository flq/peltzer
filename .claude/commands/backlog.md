---
description: Manage the project backlog (view, add, or complete items)
---

# Backlog Management

Read the file `BACKLOG.md` in the project root.

## Usage

Based on the user's command, perform one of these actions:

### View (default, no arguments)
Display the current backlog, showing both "To Do" and "Done" sections.

### Add item: `/backlog add "description"`
Add a new item to the "To Do" section:
1. Read BACKLOG.md
2. Add `- [ ] description` to the end of the "To Do" section
3. Write the updated file
4. Confirm the addition

### Complete item: `/backlog done "description"`
Move an item from "To Do" to "Done":
1. Read BACKLOG.md
2. Find the matching item in "To Do" (partial match is fine)
3. Remove it from "To Do"
4. Add `- [x] description` to the "Done" section
5. Write the updated file
6. Confirm the completion

### Remove item: `/backlog remove "description"`
Remove an item entirely (from either section):
1. Read BACKLOG.md
2. Find and remove the matching item
3. Write the updated file
4. Confirm the removal

## Notes
- When matching items, be flexible with partial matches
- Preserve the markdown format
- Keep items in the order they were added
