<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type ButtonKind = "primary" | "secondary" | "bare" | "link";
  type ButtonSize = "normal" | "big";

  interface Props extends HTMLButtonAttributes {
    pending?: boolean;
    kind?: ButtonKind;
    size?: ButtonSize;
    children: Snippet;
  }

  let { pending = false, kind = "primary", size = "normal", children, ...rest }: Props = $props();
</script>

<button class="kind-{kind} size-{size}" {...rest} disabled={pending || rest.disabled}>
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

  /* Primary - default accent background */
  .kind-primary {
    background-color: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  .kind-primary:hover:not(:disabled) {
    background-color: var(--accent-hover);
    border-color: var(--accent-hover);
  }

  /* Secondary - no background, visible border */
  .kind-secondary {
    background-color: transparent;
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .kind-secondary:hover:not(:disabled) {
    background-color: var(--bg-tertiary);
  }

  /* Bare - no chrome, inherits color from parent */
  .kind-bare {
    background-color: transparent;
    border-color: transparent;
    color: inherit;
  }

  .kind-bare:hover:not(:disabled) {
    background-color: transparent;
  }

  /* Link - styled as a link */
  .kind-link {
    background-color: transparent;
    border-color: transparent;
    color: var(--accent);
    padding: 0;
  }

  .kind-link:hover:not(:disabled) {
    text-decoration: underline;
  }

  /* Sizes */
  .size-normal {
    font-size: inherit;
  }

  .size-big {
    font-size: 20px;
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
