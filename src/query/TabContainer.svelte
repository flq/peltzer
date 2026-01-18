<script lang="ts" module>
  export interface TabContainerState {
    canAddTab: boolean;
  }
</script>

<script lang="ts">
  import type { Tab } from "./types";
  import TabBar from "./TabBar.svelte";
  import QueryTab from "./QueryTab.svelte";
  import { queryStore } from "./queryStore";

  interface Props {
    onStateChange?: (state: TabContainerState) => void;
  }

  let { onStateChange }: Props = $props();

  const MAX_TABS = 5;

  function createNewTab(): Tab {
    return {
      id: crypto.randomUUID(),
      queryText: "g.V().limit(10)",
    };
  }

  const initialTab = createNewTab();
  let tabs = $state<Tab[]>([initialTab]);
  let activeTabId = $state<string>(initialTab.id);

  let activeTab = $derived(tabs.find((t) => t.id === activeTabId)!);
  let canAddTab = $derived(tabs.length < MAX_TABS);

  // Sync active tab to store
  $effect(() => {
    if (activeTab) {
      queryStore.setActiveTab(activeTab.id, activeTab.queryText);
    }
  });

  $effect(() => {
    onStateChange?.({ canAddTab });
  });

  export function addTab() {
    if (!canAddTab) return;
    const newTab = createNewTab();
    tabs = [...tabs, newTab];
    activeTabId = newTab.id;
  }

  export function nextTab() {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    activeTabId = tabs[nextIndex].id;
  }

  export function prevTab() {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    activeTabId = tabs[prevIndex].id;
  }

  export function reset() {
    tabs = [createNewTab()];
    activeTabId = tabs[0].id;
    queryStore.reset();
  }

  function selectTab(id: string) {
    activeTabId = id;
  }

  function closeTab(id: string) {
    if (tabs.length === 1) return;

    const index = tabs.findIndex((t) => t.id === id);
    tabs = tabs.filter((t) => t.id !== id);
    queryStore.clearTab(id);

    if (activeTabId === id) {
      const newIndex = Math.min(index, tabs.length - 1);
      activeTabId = tabs[newIndex].id;
    }
  }

  function updateQueryText(text: string) {
    if (activeTab) {
      activeTab.queryText = text;
      queryStore.updateActiveQuery(text);
    }
  }
</script>

<div class="tab-container u-flex-column">
  {#if tabs.length > 1}
    <TabBar {tabs} {activeTabId} onSelectTab={selectTab} onCloseTab={closeTab} />
  {/if}
  {#if activeTab}
    {#key activeTabId}
      <QueryTab tab={activeTab} onQueryChange={updateQueryText} />
    {/key}
  {/if}
</div>

<style>
  .tab-container {
    flex: 1;
    overflow: hidden;
  }
</style>
