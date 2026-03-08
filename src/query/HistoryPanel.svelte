<script lang="ts">
  import { X } from "lucide-svelte";
  import Button from "../components/Button.svelte";
  import type { HistoryEntry } from "./historyStore";

  interface Props {
    entries: HistoryEntry[];
    onClose: () => void;
    onSelectEntry: (query: string) => void;
  }

  let { entries, onClose, onSelectEntry }: Props = $props();

  function truncate(text: string, max = 80): string {
    return text.length > max ? text.slice(0, max) + "…" : text;
  }

  function handleSelect(query: string) {
    onSelectEntry(query);
    onClose();
  }

</script>

<div class="history-panel" role="complementary" aria-label="Query History">
  <div class="history-header">
    <span>History</span>
    <Button kind="bare" onclick={onClose} aria-label="Close history">
      <X class="icon-sm" />
    </Button>
  </div>
  <div class="history-entries">
    {#if entries.length === 0}
      <p class="empty-state">No history yet</p>
    {:else}
      {#each entries as entry}
        <button class="history-entry" onclick={() => handleSelect(entry.query)}>
          {truncate(entry.query)}
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .history-panel {
    width: 100%;
    height: 100%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-05) var(--spacer-1);
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    flex-shrink: 0;
  }

  .history-entries {
    flex: 1;
    overflow-y: auto;
  }

  .history-entry {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacer-05) var(--spacer-1);
    cursor: pointer;
    font-family: monospace;
    font-size: 0.85em;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-entry:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  }

  .empty-state {
    padding: var(--spacer-1);
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
