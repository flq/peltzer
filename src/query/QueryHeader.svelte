<script lang="ts">
  import Button from "../components/Button.svelte";

  interface Props {
    disabled?: boolean;
    isExecuting?: boolean;
    canAddTab?: boolean;
    onExecute: () => void;
    onDisconnect: () => void;
    onAddTab: () => void;
  }

  let {
    disabled = false,
    isExecuting = false,
    canAddTab = true,
    onExecute,
    onDisconnect,
    onAddTab,
  }: Props = $props();
</script>

<div class="query-header">
  <h3>Query</h3>
  <div class="query-actions">
    <Button onclick={onExecute} disabled={disabled || isExecuting} pending={isExecuting}>
      Execute (Ctrl+Enter)
    </Button>
    {#if canAddTab}
      <Button kind="secondary" onclick={onAddTab}>
        New Tab
      </Button>
    {/if}
    <Button kind="secondary" onclick={onDisconnect}>
      Disconnect
    </Button>
  </div>
</div>

<style>
  .query-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-05) var(--spacer-1);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .query-header h3 {
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .query-actions {
    display: flex;
    gap: var(--spacer-05);
  }
</style>
