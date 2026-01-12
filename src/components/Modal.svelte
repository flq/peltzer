<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    onclose: () => void;
    children: Snippet;
  }

  let { open, onclose, children }: Props = $props();
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
    <button class="close-button" onclick={onclose} type="button">×</button>
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0;
    min-width: 400px;
    max-width: 90vw;
    color: var(--text-primary);
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: relative;
    padding: 24px;
  }

  .close-button {
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .close-button:hover {
    color: var(--text-primary);
    background: transparent;
  }
</style>
