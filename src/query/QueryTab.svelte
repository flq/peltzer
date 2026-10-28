<script lang="ts">
  import type { Tab } from "./types";
  import ResultsPane from "./ResultsPane.svelte";
  import ResizeDivider from "../components/ResizeDivider.svelte";
  import { queryStore } from "./queryStore";
  import { createTypingAssist } from "./typingAssist";

  interface Props {
    tab: Tab;
    onQueryChange: (text: string) => void;
  }

  let { tab, onQueryChange }: Props = $props();

  let tabResult = $derived($queryStore.tabResults.get(tab.id) ?? null);

  let queryHeight = $state(150);

  const typingAssist = createTypingAssist();

  function handleKeydown(e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (e.isComposing || e.ctrlKey || e.metaKey) {
      typingAssist.reset();
      return;
    }
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    const commands = typingAssist.handleKey({
      key: e.key,
      prevChar: value[selectionStart - 1] ?? "",
      nextChar: value[selectionEnd] ?? "",
      hasSelection: selectionStart !== selectionEnd,
    });
    if (!commands) return;

    e.preventDefault();
    for (const command of commands) {
      if (command.type === "insert") {
        insertText(textarea, command.text);
      } else {
        const pos = textarea.selectionStart + command.offset;
        textarea.setSelectionRange(pos, pos);
      }
    }
    onQueryChange(textarea.value);
  }

  function insertText(textarea: HTMLTextAreaElement, text: string) {
    // execCommand keeps the edit on the native undo stack; setRangeText is the fallback (e.g. jsdom)
    if (!document.execCommand?.("insertText", false, text)) {
      textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, "end");
    }
  }
</script>

<div class="query-tab u-flex-column">
  <div class="query-input" style="height: {queryHeight}px">
    <textarea
      value={tab.queryText}
      oninput={(e) => onQueryChange(e.currentTarget.value)}
      onkeydown={handleKeydown}
      onmousedown={() => typingAssist.reset()}
      onblur={() => typingAssist.reset()}
      placeholder="g.V().limit(10)"
      spellcheck="false"
    ></textarea>
  </div>
  <ResizeDivider
    currentHeight={queryHeight}
    onHeightChange={(h) => (queryHeight = h)}
  />
  <ResultsPane
    results={tabResult?.results ?? ""}
    resultCount={tabResult?.resultCount ?? ""}
    loading={tabResult?.isExecuting ?? false}
  />
</div>

<style>
  .query-tab {
    flex: 1;
    overflow: hidden;
  }

  .query-input {
    flex-shrink: 0;
  }

  textarea {
    width: 100%;
    height: 100%;
    padding: var(--spacer-1);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: none;
    resize: none;
    font-family: inherit;
    font-size: var(--font-size-normal);
    line-height: 1.6;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
  }

  textarea::placeholder {
    color: var(--text-secondary);
  }
</style>
