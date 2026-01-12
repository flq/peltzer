<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "./Button.svelte";

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    children: Snippet;
  }

  let { open, title, onclose, children }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  });

  function handleDialogClose() {
    onclose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) {
      onclose();
    }
  }
</script>

<dialog
  bind:this={dialog}
  onclose={handleDialogClose}
  onclick={handleBackdropClick}
>
  <div class="modal-content">
    <header class="modal-header">
      <h2>{title}</h2>
      <Button kind="bare" class="close-button" onclick={onclose} type="button">×</Button>
    </header>
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0;
    min-width: 500px;
    max-width: 90vw;
    color: var(--text-primary);
    margin: auto;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    padding: 24px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .modal-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .modal-header :global(.close-button) {
    color: var(--text-secondary);
    font-size: 20px;
    padding: 4px 8px;
    line-height: 1;
  }

  .modal-header :global(.close-button:hover) {
    color: var(--text-primary);
  }
</style>
