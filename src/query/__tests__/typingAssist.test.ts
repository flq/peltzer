import { describe, it, expect, beforeEach } from "vitest";
import { createTypingAssist, type KeyContext } from "../typingAssist";

function key(k: string, overrides: Partial<KeyContext> = {}): KeyContext {
  return { key: k, nextChar: "", hasSelection: false, ...overrides };
}

describe("typingAssist", () => {
  let assist: ReturnType<typeof createTypingAssist>;

  beforeEach(() => {
    assist = createTypingAssist();
  });

  it("lets ( through to the editor's bracket pairing", () => {
    expect(assist.handleKey(key("("))).toBeNull();
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

  it("does not arm when ( wraps a selection", () => {
    assist.handleKey(key("(", { hasSelection: true }));
    expect(assist.handleKey(key(".", { nextChar: ")" }))).toBeNull();
  });

  it("moves a dot behind ) after parens were opened by a completion", () => {
    assist.parenOpened();
    expect(assist.handleKey(key(".", { nextChar: ")" }))).not.toBeNull();
  });

  it("lets ordinary characters through", () => {
    expect(assist.handleKey(key("g"))).toBeNull();
  });
});
