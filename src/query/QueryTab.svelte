<script lang="ts">
  import type { Tab } from "./types";
  import ResultsPane from "./ResultsPane.svelte";
  import ResizeDivider from "../components/ResizeDivider.svelte";
  import { queryStore } from "./queryStore";
  import QueryEditor from "./QueryEditor.svelte";

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
    <QueryEditor
      value={tab.queryText}
      onChange={onQueryChange}
      placeholder="g.V().limit(10)"
    />
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
</style>
