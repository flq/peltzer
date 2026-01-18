<!--
  ExecutionPanel - Top-level component for query execution UI

  Component Hierarchy:
  ────────────────────
  ExecutionPanel
  ├── QueryHeader (buttons: Execute, New Tab, Disconnect)
  └── TabContainer (tab management)
      ├── TabBar (tab headers, visible when 2+ tabs)
      └── QueryTab (textarea + results)
          └── ResultsPane (results display)

  queryStore Access:
  ──────────────────
  ExecutionPanel (this component)
    - reads:  activeTabId, activeQuery, tabResults[].isExecuting
    - writes: setExecuting(), setResult()

  TabContainer
    - writes: setActiveTab(), updateActiveQuery(), clearTab(), reset()

  QueryTab
    - reads:  tabResults[tabId] (results, resultCount, isExecuting)
-->
<script lang="ts">
  import QueryHeader from "./QueryHeader.svelte";
  import TabContainer, { type TabContainerState } from "./TabContainer.svelte";
  import { isConnected } from "../lib/stores";
  import { executeQuery } from "../lib/api";
  import { queryStore } from "./queryStore";

  interface Props {
    onDisconnect: () => void;
  }

  let { onDisconnect }: Props = $props();

  let tabContainer: TabContainer;
  let containerState = $state<TabContainerState>({ canAddTab: true });

  function handleStateChange(state: TabContainerState) {
    containerState = state;
  }

  let isExecuting = $derived(
    $queryStore.activeTabId
      ? ($queryStore.tabResults.get($queryStore.activeTabId)?.isExecuting ?? false)
      : false
  );

  function handleExecute() {
    if (!$isConnected) return;
    if (!$queryStore.activeTabId || !$queryStore.activeQuery.trim()) return;

    const tabId = $queryStore.activeTabId;
    const query = $queryStore.activeQuery.trim();

    queryStore.setExecuting(tabId);

    // Execute and write results back to store
    executeQuery(query)
      .then((result) => {
        let resultCount = "";
        try {
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            resultCount = `${parsed.length} result(s)`;
          }
        } catch {
          // non-JSON result, no count
        }
        queryStore.setResult(tabId, result, resultCount);
      })
      .catch((e) => {
        queryStore.setResult(tabId, `Error: ${e}`, "");
      });
  }

  function handleAddTab() {
    tabContainer.addTab();
  }

  function handleDisconnect() {
    tabContainer.reset();
    onDisconnect();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleExecute();
      } else if (e.key === "t") {
        e.preventDefault();
        handleAddTab();
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          tabContainer.prevTab();
        } else {
          tabContainer.nextTab();
        }
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="execution-panel u-flex-column">
  <QueryHeader
    disabled={!$isConnected}
    {isExecuting}
    canAddTab={containerState.canAddTab}
    onExecute={handleExecute}
    onAddTab={handleAddTab}
    onDisconnect={handleDisconnect}
  />
  <TabContainer bind:this={tabContainer} onStateChange={handleStateChange} />
</div>

<style>
  .execution-panel {
    height: 100%;
    overflow: hidden;
  }
</style>
