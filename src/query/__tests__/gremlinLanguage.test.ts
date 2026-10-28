import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection, type Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { selectParentSyntax, cursorSyntaxRight, cursorMatchingBracket } from "@codemirror/commands";
import type { SyntaxNode } from "@lezer/common";
import { gremlinLanguage, gremlin } from "../gremlinLanguage";

// Named nodes only, leaving out punctuation, e.g. Step(StepName,ArgList(String))
function tree(text: string): string {
  const format = (node: SyntaxNode): string => {
    const children: string[] = [];
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (/^[A-Z]/.test(child.name)) children.push(format(child));
    }
    return children.length ? `${node.name}(${children.join(",")})` : node.name;
  };
  return format(gremlinLanguage.parser.parse(text).topNode);
}

describe("gremlin grammar", () => {
  it("parses a traversal into steps with arguments", () => {
    expect(tree('g.V().has("name", "Alice").limit(5)')).toBe(
      "Query(Traversal(Identifier,Step(StepName,ArgList),Step(StepName,ArgList(String,String)),Step(StepName,ArgList(Number))))"
    );
  });

  it("parses nested anonymous traversals and enums", () => {
    expect(tree('g.V().where(out("knows")).by(T.label)')).toBe(
      "Query(Traversal(Identifier,Step(StepName,ArgList)," +
        "Step(StepName,ArgList(Traversal(Step(StepName,ArgList(String)))))," +
        "Step(StepName,ArgList(Traversal(Identifier,Identifier)))))"
    );
  });

  it("recognises values: single-quoted strings, suffixed numbers, booleans, null, lists", () => {
    expect(tree("f('a', 30L, -1.5, true, null, [1, 2])")).toBe(
      "Query(Traversal(Step(StepName,ArgList(String,Number,Number,Boolean,Null,List(Number,Number)))))"
    );
  });

  it("skips line comments", () => {
    expect(tree("// all vertices\ng.V()")).toBe("Query(LineComment,Traversal(Identifier,Step(StepName,ArgList)))");
  });

  it("still produces a tree for unfinished input", () => {
    expect(tree('g.V().has("na')).toContain("Step(StepName");
  });
});

// What the stock CodeMirror commands do once they can see the Gremlin structure
describe("structural movement", () => {
  const query = 'g.V().has("name", "Alice").out("knows")';

  function stateAt(pos: number) {
    return EditorState.create({ doc: query, selection: EditorSelection.cursor(pos), extensions: [gremlin()] });
  }

  function run(state: EditorState, command: typeof selectParentSyntax): EditorState {
    let next = state;
    command({ state, dispatch: (tr: Transaction) => (next = tr.state) });
    return next;
  }

  function selected(state: EditorState): string {
    const { from, to } = state.selection.main;
    return state.sliceDoc(from, to);
  }

  it("expands the selection from a string to its step and then the whole traversal", () => {
    let state = stateAt(query.indexOf("Alice") + 1);
    const steps: string[] = [];
    for (let i = 0; i < 4; i++) {
      state = run(state, selectParentSyntax);
      steps.push(selected(state));
    }
    expect(steps).toEqual([
      '"Alice"',
      '("name", "Alice")',
      'has("name", "Alice")',
      query,
    ]);
  });

  it("jumps over a whole step's arguments", () => {
    // Syntax jumps need a view to know the text direction
    const view = new EditorView({ state: stateAt(query.indexOf("(", 5)), parent: document.body });
    cursorSyntaxRight(view);
    expect(view.state.selection.main.head).toBe(query.indexOf(".out"));
    view.destroy();
  });

  it("jumps to the matching bracket", () => {
    const state = run(stateAt(query.indexOf("(", 5)), cursorMatchingBracket);
    expect(state.selection.main.head).toBe(query.indexOf(".out"));
  });
});
