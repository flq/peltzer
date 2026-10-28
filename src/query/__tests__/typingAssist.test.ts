import { describe, it, expect, beforeEach } from "vitest";
import { createTypingAssist, type KeyContext } from "../typingAssist";

function key(k: string, overrides: Partial<KeyContext> = {}): KeyContext {
  return { key: k, prevChar: "", nextChar: "", hasSelection: false, ...overrides };
}

describe("typingAssist", () => {
  let assist: ReturnType<typeof createTypingAssist>;

  beforeEach(() => {
    assist = createTypingAssist();
  });

  describe("parentheses", () => {
    it("auto-closes ( and places the cursor inside", () => {
      expect(assist.handleKey(key("("))).toEqual([
        { type: "insert", text: "()" },
        { type: "move", offset: -1 },
      ]);
    });

    it("moves a dot behind ) when typed right after (", () => {
      assist.handleKey(key("("));
      expect(assist.handleKey(key(".", { nextChar: ")" }))).toEqual([
        { type: "move", offset: 1 },
        { type: "insert", text: "." },
      ]);
    });

    it("ignores modifier keys between ( and the dot", () => {
      assist.handleKey(key("("));
      assist.handleKey(key("Shift"));
      expect(assist.handleKey(key(".", { nextChar: ")" }))).not.toBeNull();
    });

    it("types a dot normally once something else was typed inside the parens", () => {
      assist.handleKey(key("("));
      assist.handleKey(key("1", { nextChar: ")" }));
      expect(assist.handleKey(key(".", { nextChar: ")" }))).toBeNull();
    });

    it("types a dot normally after a reset", () => {
      assist.handleKey(key("("));
      assist.reset();
      expect(assist.handleKey(key(".", { nextChar: ")" }))).toBeNull();
    });

    it("types a dot normally when not followed by )", () => {
      assist.handleKey(key("("));
      expect(assist.handleKey(key(".", { nextChar: "x" }))).toBeNull();
    });

    it("steps over an existing ) instead of typing another", () => {
      expect(assist.handleKey(key(")", { nextChar: ")" }))).toEqual([{ type: "move", offset: 1 }]);
    });

    it("types ) normally when the next char is not )", () => {
      expect(assist.handleKey(key(")", { nextChar: "" }))).toBeNull();
    });
  });

  describe("quotes", () => {
    it("auto-closes a quote and places the cursor inside", () => {
      expect(assist.handleKey(key('"', { prevChar: "(" }))).toEqual([
        { type: "insert", text: '""' },
        { type: "move", offset: -1 },
      ]);
    });

    it("steps over an existing closing quote", () => {
      expect(assist.handleKey(key('"', { prevChar: "e", nextChar: '"' }))).toEqual([
        { type: "move", offset: 1 },
      ]);
    });

    it("does not pair a quote typed right after a word character", () => {
      expect(assist.handleKey(key('"', { prevChar: "e" }))).toBeNull();
    });
  });

  it("does nothing when text is selected", () => {
    expect(assist.handleKey(key("(", { hasSelection: true }))).toBeNull();
    expect(assist.handleKey(key('"', { hasSelection: true }))).toBeNull();
  });

  it("lets ordinary characters through", () => {
    expect(assist.handleKey(key("g"))).toBeNull();
  });
});
