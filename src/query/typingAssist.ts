export type EditCommand =
  | { type: "insert"; text: string }
  | { type: "move"; offset: number };

export interface KeyContext {
  key: string;
  prevChar: string;
  nextChar: string;
  hasSelection: boolean;
}

// Pressing these alone (e.g. Shift before "(") must not count as "typing something else"
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "AltGraph", "Meta", "CapsLock"]);

/**
 * Small typing helpers for the query editor. Returns the edit commands to apply
 * instead of the default keystroke, or null to let the keystroke through.
 */
export function createTypingAssist() {
  // Only right after typing "(" do we treat "." as "step out of the empty parens", as in g.V().
  let justOpenedParen = false;

  function handleKey({ key, prevChar, nextChar, hasSelection }: KeyContext): EditCommand[] | null {
    if (MODIFIER_KEYS.has(key)) return null;

    const wasJustOpened = justOpenedParen;
    justOpenedParen = false;

    if (hasSelection) return null;

    switch (key) {
      case "(":
        justOpenedParen = true;
        return [{ type: "insert", text: "()" }, { type: "move", offset: -1 }];

      case ".":
        if (wasJustOpened && nextChar === ")") {
          return [{ type: "move", offset: 1 }, { type: "insert", text: "." }];
        }
        return null;

      // Typing the closer that was auto-inserted just steps over it
      case ")":
        return nextChar === ")" ? [{ type: "move", offset: 1 }] : null;

      case '"':
        if (nextChar === '"') return [{ type: "move", offset: 1 }];
        // After a word character this is most likely closing a string, not opening one
        if (/\w/.test(prevChar)) return null;
        return [{ type: "insert", text: '""' }, { type: "move", offset: -1 }];

      default:
        return null;
    }
  }

  function reset() {
    justOpenedParen = false;
  }

  return { handleKey, reset };
}
