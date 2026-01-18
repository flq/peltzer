<script lang="ts">
  import type { Tab } from "./types";
  import Button from "../components/Button.svelte";
  import { X } from "lucide-svelte";

  interface Props {
    tabs: Tab[];
    activeTabId: string;
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
  }

  let { tabs, activeTabId, onSelectTab, onCloseTab }: Props = $props();
</script>

<div class="tab-bar">
  {#each tabs as tab, index (tab.id)}
    <div class="tab" class:active={tab.id === activeTabId}>
      <button class="tab-label" onclick={() => onSelectTab(tab.id)}>
        Query {index + 1}
      </button>
      <Button kind="bare" size="small" class="tab-close" onclick={() => onCloseTab(tab.id)} title="Close tab">
        <X class="icon-sm" />
      </Button>
    </div>
  {/each}
</div>

<style>
  .tab-bar {
    display: flex;
    gap: 2px;
    padding: var(--spacer-05) var(--spacer-1) 1px var(--spacer-05);
    background-color: var(--bg-secondary);
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--spacer-025) var(--spacer-05);
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius) var(--border-radius) 0 0;
  }

  .tab.active {
    background-color: var(--accent);
    border-color: var(--accent);
  }

  .tab.active .tab-label {
    color: white;
  }

  .tab-label {
    background: none;
    border: none;
    padding: var(--spacer-025) var(--spacer-05);
    color: var(--text-primary);
    font-size: var(--font-size-small);
    cursor: pointer;
  }

  .tab-label:hover {
    color: var(--accent);
  }

  .tab.active .tab-label:hover {
    color: white;
  }

  .tab :global(.tab-close) {
    padding: 0 var(--spacer-025);
    font-size: 14px;
    line-height: 1;
  }

  .tab.active :global(.tab-close) {
    color: white;
  }
</style>
