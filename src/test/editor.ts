import { screen } from "@testing-library/svelte";
import { EditorView } from "@codemirror/view";

// The query editor's CodeMirror view, found by role like a user would find the editor
export function editorView(): EditorView {
  const view = EditorView.findFromDOM(screen.getByRole("textbox"));
  if (!view) throw new Error("The textbox is not a CodeMirror editor");
  return view;
}
