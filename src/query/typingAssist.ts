export type EditCommand =
  | { type: "insert"; text: string }
  | { type: "move"; offset: number };

export interface KeyContext {
  key: string;
  nextChar: string;
  hasSelection: boolean;
}

// Pressing these alone (e.g. Shift before "(") must not count as "typing something else"
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "AltGraph", "Meta", "CapsLock"]);

/**
 * Typing helpers on top of the editor's own bracket pairing. Returns the edit commands
 * to apply instead of the default keystroke, or null to let the keystroke through.
 */
export function createTypingAssist() {
  // Only right after typing "(" do we treat "." as "step out of the empty parens", as in g.V().
  let justOpenedParen = false;

  function handleKey({ key, nextChar, hasSelection }: KeyContext): EditCommand[] | null {
    if (MODIFIER_KEYS.has(key)) return null;

    const wasJustOpened = justOpenedParen;
    justOpenedParen = key === "(" && !hasSelection;

    if (key === "." && wasJustOpened && !hasSelection && nextChar === ")") {
      return [{ type: "move", offset: 1 }, { type: "insert", text: "." }];
    }
    return null;
  }

  function reset() {
    justOpenedParen = false;
  }

  return { handleKey, reset };
}
