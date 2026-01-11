<script lang="ts">
  import { toasts } from "../lib/toastStore";
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}">
      <span class="toast-message">{toast.message}</span>
      <button class="toast-close" onclick={() => toasts.remove(toast.id)}>
        &times;
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 4px;
    min-width: 250px;
    max-width: 400px;
  }

  .toast-success {
    background-color: #10b981;
    color: white;
  }

  .toast-error {
    background-color: #ef4444;
    color: white;
  }

  .toast-message {
    flex: 1;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.8;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
