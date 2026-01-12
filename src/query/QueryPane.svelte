<script lang="ts">
  import Button from "../components/Button.svelte";

  interface Props {
    disabled?: boolean;
    isExecuting?: boolean;
    onexecute: (query: string) => void;
    ondisconnect: () => void;
  }

  let { disabled = false, isExecuting = false, onexecute, ondisconnect }: Props = $props();

  let queryText = $state("g.V().limit(10)");

  function handleExecute() {
    const query = queryText.trim();
    if (query && !disabled && !isExecuting) {
      onexecute(query);
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
    <div class="query-actions">
      <Button
        onclick={handleExecute}
        disabled={disabled || isExecuting}
        pending={isExecuting}
      >
        Execute (Ctrl+Enter)
      </Button>
      <Button kind="secondary" onclick={ondisconnect}>
        Disconnect
      </Button>
    </div>
  </div>
  <textarea
    bind:value={queryText}
    onkeydown={handleKeydown}
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

  .query-actions {
    display: flex;
    gap: 8px;
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
