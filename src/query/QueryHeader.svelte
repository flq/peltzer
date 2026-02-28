<script lang="ts">
  import Button from "../components/Button.svelte";
  import { Play, FilePlusCorner, Unplug, FolderOpen, Save } from "lucide-svelte";

  interface Props {
    disabled?: boolean;
    isExecuting?: boolean;
    canAddTab?: boolean;
    onExecute: () => void;
    onDisconnect: () => void;
    onAddTab: () => void;
    onOpenFile: () => void;
    onSaveFile: () => void;
  }

  let {
    disabled = false,
    isExecuting = false,
    canAddTab = true,
    onExecute,
    onDisconnect,
    onAddTab,
    onOpenFile,
    onSaveFile,
  }: Props = $props();
</script>

<div class="query-header">
  <h3>Query</h3>
  <div class="query-actions">
    <Button kind="secondary" onclick={onOpenFile} title="Open File (Cmd+O)">
      <FolderOpen class="icon-md" />
    </Button>
    <Button kind="secondary" onclick={onSaveFile} title="Save File (Cmd+S)">
      <Save class="icon-md" />
    </Button>
    <Button onclick={onExecute} disabled={disabled || isExecuting} pending={isExecuting} title="Execute (Ctrl+Enter)">
      <Play class="icon-md" />
    </Button>
    {#if canAddTab}
      <Button kind="secondary" onclick={onAddTab} title="New Tab (Ctrl+T)">
        <FilePlusCorner class="icon-md" />
      </Button>
    {/if}
    <Button kind="secondary" onclick={onDisconnect} title="Disconnect">
      <Unplug class="icon-md" />
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
