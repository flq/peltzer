import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { EditorView } from "@codemirror/view";
import QueryEditor from "../QueryEditor.svelte";

function setup(value: string) {
  const onChange = vi.fn();
  const { container, rerender } = render(QueryEditor, { props: { value, onChange } });
  const content = container.querySelector(".cm-content") as HTMLElement;
  const view = EditorView.findFromDOM(content)!;
  view.dispatch({ selection: { anchor: value.length } });
  return { view, content, onChange, rerender };
}

// jsdom can't drive real text input, so call the editor's input handlers the way a keystroke would
function typeChar(view: EditorView, text: string) {
  const { from, to } = view.state.selection.main;
  const handled = view.state
    .facet(EditorView.inputHandler)
    .some((handler) => handler(view, from, to, text, () => view.state.update({ changes: { from, to, insert: text } })));
  if (!handled) {
    view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
  }
}

describe("QueryEditor", () => {
  it("shows the initial value", () => {
    const { view } = setup("g.V().count()");
    expect(view.state.doc.toString()).toBe("g.V().count()");
  });

  it("reports edits through onChange", () => {
    const { view, onChange } = setup("g.V");
    typeChar(view, "x");
    expect(onChange).toHaveBeenLastCalledWith("g.Vx");
  });

  it("picks up a value set from outside", async () => {
    const { view, rerender } = setup("g.V");
    await rerender({ value: "g.E()" });
    expect(view.state.doc.toString()).toBe("g.E()");
  });

  it("auto-closes ( and keeps the cursor inside", () => {
    const { view } = setup("g.V");
    typeChar(view, "(");
    expect(view.state.doc.toString()).toBe("g.V()");
    expect(view.state.selection.main.head).toBe(4);
  });

  it("auto-closes a quote and keeps the cursor inside", () => {
    const { view } = setup("g.V().has(");
    typeChar(view, '"');
    expect(view.state.doc.toString()).toBe('g.V().has(""');
    expect(view.state.selection.main.head).toBe(11);
  });

  it("does not auto-close [ or '", () => {
    const { view } = setup("x");
    typeChar(view, "[");
    typeChar(view, "'");
    expect(view.state.doc.toString()).toBe("x['");
  });

  it("puts a dot typed right after ( behind the closing paren", async () => {
    const { view, content } = setup("g.V");
    await fireEvent.keyDown(content, { key: "(" });
    typeChar(view, "(");
    await fireEvent.keyDown(content, { key: "." });
    expect(view.state.doc.toString()).toBe("g.V().");
    expect(view.state.selection.main.head).toBe(6);
  });
});
