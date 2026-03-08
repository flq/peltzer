<!--
  ExecutionPanel - Top-level component for query execution UI

  Component Hierarchy:
  ────────────────────
  ExecutionPanel
  ├── QueryHeader (buttons: Execute, New Tab, History, Disconnect)
  └── .tab-area (position: relative, fills remaining height)
      ├── TabContainer (tab management)
      │   ├── TabBar (tab headers, visible when 2+ tabs)
      │   └── QueryTab (textarea + results)
      │       └── ResultsPane (results display)
      └── HistoryPanel (absolutely positioned overlay, shown when showHistory=true)

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
  import HistoryPanel from "./HistoryPanel.svelte";
  import { isConnected } from "../lib/stores";
  import { executeQuery } from "../lib/api";
  import { queryStore } from "./queryStore";
  import { historyStore } from "./historyStore";

  interface Props {
    onDisconnect: () => void;
  }

  let { onDisconnect }: Props = $props();

  let tabContainer: TabContainer;
  let containerState = $state<TabContainerState>({ canAddTab: true });
  let showHistory = $state(false);

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
        historyStore.add(query);
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

  function handleOpenFile() {
    tabContainer.openFile();
  }

  function handleSaveFile() {
    tabContainer.saveFile();
  }

  function handleToggleHistory() {
    showHistory = !showHistory;
  }

  function handleLoadHistoryEntry(query: string) {
    tabContainer.setActiveQuery(query);
    showHistory = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleExecute();
      } else if (e.key === "h") {
        e.preventDefault();
        handleToggleHistory();
      } else if (e.key === "t") {
        e.preventDefault();
        handleAddTab();
      } else if (e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      } else if (e.key === "o") {
        e.preventDefault();
        handleOpenFile();
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          tabContainer.prevTab();
        } else {
          tabContainer.nextTab();
        }
      }
    } else if (e.key === "Escape" && showHistory) {
      showHistory = false;
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
    onOpenFile={handleOpenFile}
    onSaveFile={handleSaveFile}
    onToggleHistory={handleToggleHistory}
  />
  <div class="tab-area">
    <TabContainer bind:this={tabContainer} onStateChange={handleStateChange} />
    {#if showHistory}
      <div class="history-overlay">
        <HistoryPanel
          entries={$historyStore}
          onClose={() => (showHistory = false)}
          onSelectEntry={handleLoadHistoryEntry}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .execution-panel {
    height: 100%;
    overflow: hidden;
  }

  .tab-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .history-overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    z-index: 10;
  }
</style>
