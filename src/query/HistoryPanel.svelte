<script lang="ts" module>
  // Survives component unmount/remount (i.e. open/close cycles) but not window resize.
  let savedWidth: number | null = null;
</script>

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

  // Width is runtime-computed so we can't use a CSS clamp() literal as initial value —
  // start with null; the CSS clamp() on the element handles responsive sizing
  // until the user drags.
  let width = $state<number | null>(savedWidth);
  let panelEl: HTMLElement;

  // Keep savedWidth in sync and reset on window resize.
  $effect(() => {
    savedWidth = width;
    const controller = new AbortController();
    window.addEventListener("resize", () => { width = null; }, { signal: controller.signal });
    return () => controller.abort();
  });

  const MIN_WIDTH = 200;
  const MAX_WIDTH_VW = 0.7;

  function maxWidth() {
    return window.innerWidth * MAX_WIDTH_VW;
  }

  let dragController: AbortController | null = null;

  $effect(() => {
    return () => {
      dragController?.abort();
    };
  });

  function startDrag(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width ?? panelEl?.offsetWidth ?? 320;

    dragController = new AbortController();
    const { signal } = dragController;

    window.addEventListener("mousemove", (e: MouseEvent) => {
      const delta = startX - e.clientX;
      width = Math.min(Math.max(startWidth + delta, MIN_WIDTH), maxWidth());
    }, { signal });

    window.addEventListener("mouseup", () => {
      dragController?.abort();
      dragController = null;
    }, { signal });
  }

  function handleSelect(query: string) {
    onSelectEntry(query);
    onClose();
  }
</script>

<div
  class="history-panel"
  role="complementary"
  aria-label="Query History"
  style={width !== null ? `width: ${width}px` : undefined}
  bind:this={panelEl}
>
  <div class="drag-handle" onmousedown={startDrag} aria-hidden="true"></div>
  <div class="history-header">
    <h3>History</h3>
    <Button kind="bare" onclick={onClose} aria-label="Close history">
      <X class="icon-sm" />
    </Button>
  </div>
  <div class="history-entries">
    {#if entries.length === 0}
      <p class="empty-state">No history yet</p>
    {:else}
      {#each entries as entry}
        <button class="history-entry" title={entry.query} onclick={() => handleSelect(entry.query)}>
          <span class="entry-text">{entry.query}</span>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .history-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: clamp(280px, 25vw, 520px);
    z-index: 10;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
  }

  .drag-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    z-index: 1;
  }

  .drag-handle:hover {
    background: var(--border-color);
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-05) var(--spacer-1);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .history-header h3 {
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .history-entries {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacer-025);
    padding: var(--spacer-025);
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
    line-height: 1.4;
    min-height: calc(2 * 1.4em + 2 * var(--spacer-05));
    box-sizing: border-box;
    color: var(--text-primary);
    overflow: hidden;
  }

  .history-entry:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  }

  .entry-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .empty-state {
    padding: var(--spacer-1);
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
