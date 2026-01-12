<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let disabled = false;
  export let isExecuting = false;

  const dispatch = createEventDispatcher<{ execute: string }>();

  // Local state for the query text
  let queryText = "g.V().limit(10)";

  function handleExecute() {
    const query = queryText.trim();
    if (query && !disabled && !isExecuting) {
      dispatch("execute", query);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleExecute();
    }
  }
</script>

<div class="query-section">
  <div class="query-header">
    <h3>Query</h3>
    <button
      on:click={handleExecute}
      disabled={disabled || isExecuting}
    >
      {isExecuting ? "Executing..." : "Execute (Ctrl+Enter)"}
    </button>
  </div>
  <textarea
    bind:value={queryText}
    on:keydown={handleKeydown}
    placeholder="g.V().limit(10)"
    spellcheck="false"
  ></textarea>
</div>

<style>
  .query-section {
    display: flex;
    flex-direction: column;
    height: 40%;
    min-height: 150px;
    border-bottom: 1px solid var(--border-color);
  }

  .query-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .query-header h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    margin: 0;
  }

  textarea {
    flex: 1;
    width: 100%;
    padding: 16px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: none;
    resize: none;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.6;
  }

  textarea:focus {
    outline: none;
  }

  textarea::placeholder {
    color: var(--text-secondary);
  }
</style>
