<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    pending?: boolean;
    children: Snippet;
  }

  let { pending = false, children, ...rest }: Props = $props();
</script>

<button {...rest} disabled={pending || rest.disabled}>
  {#if pending}
    <span class="spinner"></span>
  {/if}
  <span class="content" class:hidden={pending}>
    {@render children()}
  </span>
</button>

<style>
  button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .content.hidden {
    visibility: hidden;
  }

  .spinner {
    position: absolute;
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
