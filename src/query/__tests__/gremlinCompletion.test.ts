import { describe, it, expect, vi } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { CompletionContext, closeBrackets, type Completion } from "@codemirror/autocomplete";
import { gremlin } from "../gremlinLanguage";
import { gremlinStepCompletion } from "../gremlinCompletion";

const extensions = [gremlin(), closeBrackets()];

// "|" marks the cursor
function complete(textWithCursor: string, explicit = false) {
  const pos = textWithCursor.indexOf("|");
  const doc = textWithCursor.replace("|", "");
  const state = EditorState.create({ doc, extensions });
  return gremlinStepCompletion()(new CompletionContext(state, pos, explicit));
}

function labels(textWithCursor: string): string[] | null {
  const result = complete(textWithCursor);
  return result ? result.options.map((o) => o.label) : null;
}

describe("gremlin step completion", () => {
  it("offers start steps after g.", () => {
    const options = labels("g.|")!;
    expect(options).toContain("V");
    expect(options).toContain("addV");
    expect(options).not.toContain("out");
  });

  it("offers steps after a step", () => {
    const options = labels("g.V().|")!;
    expect(options).toContain("out");
    expect(options).toContain("has");
    expect(options).not.toContain("V");
  });

  it("replaces the partly typed step name", () => {
    expect(complete("g.V().ha|")!.from).toBe("g.V().".length);
  });

  it("offers steps after an anonymous traversal __.", () => {
    expect(labels("g.V().where(__.|")).toContain("out");
  });

  it("offers steps for an anonymous traversal once something is typed", () => {
    expect(labels("g.V().where(ou|")).toContain("out");
    expect(labels("g.V().has(\"age\", gt(1), |")).toBeNull();
  });

  it("does not offer anything after enum and class names", () => {
    expect(labels("g.V().by(T.|")).toBeNull();
    expect(labels("g.V().order().by(Order.|")).toBeNull();
  });

  it("does not offer anything inside strings", () => {
    expect(labels('g.V().has("na.|")')).toBeNull();
  });

  it("does not open by itself without a dot or a typed name", () => {
    expect(labels("g.V().limit(|")).toBeNull();
    expect(labels("g|")).toBeNull();
  });
});

describe("applying a step", () => {
  function apply(textWithCursor: string, stepName: string, onParenOpened = vi.fn()) {
    const pos = textWithCursor.indexOf("|");
    const doc = textWithCursor.replace("|", "");
    const view = new EditorView({
      state: EditorState.create({ doc, selection: EditorSelection.cursor(pos), extensions }),
      parent: document.body,
    });
    const result = gremlinStepCompletion(onParenOpened)(new CompletionContext(view.state, pos, false))!;
    const option = result.options.find((o) => o.label === stepName)!;
    (option.apply as Exclude<Completion["apply"], string | undefined>)(view, option, result.from, pos);
    const text = view.state.doc.toString();
    const cursor = view.state.selection.main.head;
    view.destroy();
    return text.slice(0, cursor) + "|" + text.slice(cursor);
  }

  it("leaves the cursor inside the parens for steps that take arguments", () => {
    const onParenOpened = vi.fn();
    expect(apply("g.V().ha|", "has", onParenOpened)).toBe("g.V().has(|)");
    expect(onParenOpened).toHaveBeenCalled();
  });

  it("puts the cursor behind the parens for steps without arguments", () => {
    const onParenOpened = vi.fn();
    expect(apply("g.V().cou|", "count", onParenOpened)).toBe("g.V().count()|");
    expect(onParenOpened).not.toHaveBeenCalled();
  });

  it("keeps existing arguments when renaming a step", () => {
    expect(apply('g.V().ou|("knows")', "outE")).toBe('g.V().outE|("knows")');
  });
});
