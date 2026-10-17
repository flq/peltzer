<script lang="ts">
  import type { Tab } from "./types";
  import ResultsPane from "./ResultsPane.svelte";
  import ResizeDivider from "../components/ResizeDivider.svelte";
  import { queryStore } from "./queryStore";

  interface Props {
    tab: Tab;
    onQueryChange: (text: string) => void;
  }

  let { tab, onQueryChange }: Props = $props();

  let tabResult = $derived($queryStore.tabResults.get(tab.id) ?? null);

  let queryHeight = $state(150);
</script>

<div class="query-tab u-flex-column">
  <div class="query-input" style="height: {queryHeight}px">
    <textarea
      value={tab.queryText}
      oninput={(e) => onQueryChange(e.currentTarget.value)}
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
