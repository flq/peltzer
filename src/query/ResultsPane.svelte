<script lang="ts">
  export let results = "";
  export let resultCount = "";
</script>

<div class="results-section">
  <div class="results-header">
    <h3>Results</h3>
    <span class="result-count">{resultCount}</span>
  </div>
  <pre class="results-output">{results}</pre>
</div>

<style>
  .results-section {
    flex: 1;
    display: flex;
    flex-direction: column;
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

  .result-count {
    color: var(--text-secondary);
  }

  .results-output {
    flex: 1;
    margin: 0;
    padding: var(--spacer-1);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
