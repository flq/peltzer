<script lang="ts">
  import { onMount } from "svelte";
  import { EditorState, type ChangeSpec } from "@codemirror/state";
  import { EditorView, keymap, placeholder as placeholderText } from "@codemirror/view";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
  import { HighlightStyle, bracketMatching, syntaxHighlighting } from "@codemirror/language";
  import { tags } from "@lezer/highlight";
  import { createTypingAssist, type EditCommand } from "./typingAssist";
  import { gremlin } from "./gremlinLanguage";

  interface Props {
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
  }

  let { value, onChange, placeholder = "" }: Props = $props();

  let container: HTMLDivElement;
  let view = $state.raw<EditorView>();

  const typingAssist = createTypingAssist();

  const valueHighlighting = syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.string, color: "var(--syntax-string)" },
      { tag: tags.number, color: "var(--syntax-number)" },
      { tag: [tags.bool, tags.null], color: "var(--syntax-atom)" },
    ])
  );

  const theme = EditorView.theme(
    {
      "&": {
        height: "100%",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontSize: "var(--font-size-normal)",
      },
      "&.cm-focused": { outline: "none" },
      ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.6" },
      ".cm-content": { padding: "var(--spacer-1)", caretColor: "var(--text-primary)" },
      ".cm-line": { padding: "0" },
      ".cm-cursor": { borderLeftColor: "var(--text-primary)" },
      ".cm-placeholder": { color: "var(--text-secondary)" },
      "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
        { backgroundColor: "var(--selection-bg)" },
    },
    { dark: true }
  );

  const assistHandlers = EditorView.domEventHandlers({
    keydown(e, view) {
      if (e.isComposing || e.ctrlKey || e.metaKey) {
        typingAssist.reset();
        return false;
      }
      const { from, to, head } = view.state.selection.main;
      const commands = typingAssist.handleKey({
        key: e.key,
        nextChar: view.state.sliceDoc(head, head + 1),
        hasSelection: from !== to,
      });
      if (!commands) return false;
      e.preventDefault();
      applyCommands(view, commands);
      return true;
    },
    mousedown() {
      typingAssist.reset();
    },
    blur() {
      typingAssist.reset();
    },
  });

  // One transaction, so a single undo reverts the whole assisted keystroke
  function applyCommands(view: EditorView, commands: EditCommand[]) {
    const changes: ChangeSpec[] = [];
    let pos = view.state.selection.main.head;
    let inserted = 0;
    for (const command of commands) {
      if (command.type === "insert") {
        changes.push({ from: pos - inserted, insert: command.text });
        pos += command.text.length;
        inserted += command.text.length;
      } else {
        pos += command.offset;
      }
    }
    view.dispatch({ changes, selection: { anchor: pos }, userEvent: "input.type", scrollIntoView: true });
  }

  onMount(() => {
    view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          closeBrackets(),
          assistHandlers,
          keymap.of([
            ...closeBracketsKeymap,
            // Mod-Enter executes the query (handled by ExecutionPanel)
            ...defaultKeymap.filter((binding) => binding.key !== "Mod-Enter"),
            ...historyKeymap,
          ]),
          gremlin(),
          bracketMatching(),
          valueHighlighting,
          placeholderText(placeholder),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ spellcheck: "false" }),
          theme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    return () => view?.destroy();
  });

  // Picks up text set from outside, e.g. loading a file or a history entry
  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  });
</script>

<div class="query-editor" bind:this={container}></div>

<style>
  .query-editor {
    height: 100%;
  }
</style>
