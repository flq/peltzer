<script lang="ts">
  import { Copy, Check } from "@lucide/svelte";
  import Button from "../components/Button.svelte";

  interface Props {
    results?: string;
    resultCount?: string;
    loading?: boolean;
  }

  let { results = "", resultCount = "", loading = false }: Props = $props();

  let copied = $state(false);

  async function copyResults() {
    if (!results) return;
    await navigator.clipboard.writeText(results);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<div class="results-section u-flex-column">
  <div class="results-header">
    <h3>Results</h3>
    <div class="results-header-right">
      <span class="result-count">{resultCount}</span>
      <Button kind="bare" onclick={copyResults} disabled={!results} title="Copy results">
        {#if copied}
          <Check size={14} />
        {:else}
          <Copy size={14} />
        {/if}
      </Button>
    </div>
  </div>
  <pre class="results-output" class:loading>{results}</pre>
</div>

<style>
  .results-section {
    flex: 1;
    overflow: hidden;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-05) var(--spacer-1);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .results-header h3 {
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .results-header-right {
    display: flex;
    align-items: center;
    gap: var(--spacer-05);
  }

  .result-count {
    color: var(--text-secondary);
  }


  .results-output {
    flex: 1;
    margin: 0;
    padding: var(--spacer-1);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    /* <pre> otherwise gets the browser's generic monospace instead of the app font */
    font-family: inherit;
    font-size: var(--font-size-normal);
    line-height: var(--line-height-code);
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    transition: opacity 0.15s ease-in-out;
  }

  .results-output.loading {
    opacity: 0.5;
  }
</style>
