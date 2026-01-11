<script lang="ts">
  import {
    queryText,
    results,
    resultCount,
    isExecuting,
    isConnected,
  } from "../lib/stores";
  import { executeQuery } from "../lib/api";

  async function handleExecute() {
    const query = $queryText.trim();
    if (!query || !$isConnected) return;

    isExecuting.set(true);
    results.set("Executing...");
    resultCount.set("");

    try {
      const result = await executeQuery(query);
      results.set(result);

      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          resultCount.set(`${parsed.length} result(s)`);
        }
      } catch {
        // Not JSON, that's fine
      }
    } catch (e) {
      results.set(`Error: ${e}`);
      resultCount.set("");
    } finally {
      isExecuting.set(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if ($isConnected) {
        handleExecute();
      }
    }
  }
</script>

<div class="query-section">
  <div class="query-header">
    <h3>Query</h3>
    <button
      on:click={handleExecute}
      disabled={!$isConnected || $isExecuting}
    >
      {$isExecuting ? "Executing..." : "Execute (Ctrl+Enter)"}
    </button>
  </div>
  <textarea
    bind:value={$queryText}
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
