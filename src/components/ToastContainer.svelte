<script lang="ts">
  import { toasts } from "../lib/toastStore";
  import Button from "./Button.svelte";
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}">
      <span class="toast-message">{toast.message}</span>
      <Button kind="bare" size="big" onclick={() => toasts.remove(toast.id)}>&times;</Button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: var(--spacer-1);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacer-05);
    z-index: 1000;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: var(--spacer-1);
    padding: var(--spacer-075) 0 var(--spacer-075) var(--spacer-1);
    border-radius: var(--border-radius);
    min-width: 250px;
    max-width: 80%;
  }

  .toast-success {
    background-color: var(--success-color);
    color: white;
  }

  .toast-error {
    background-color: var(--error-color);
    color: white;
  }

  .toast-message {
    flex: 1;
  }
</style>
