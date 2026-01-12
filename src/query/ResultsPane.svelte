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
    padding: 8px 16px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .results-header h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    margin: 0;
  }

  .result-count {
    font-size: 11px;
    color: var(--text-secondary);
  }

  .results-output {
    flex: 1;
    margin: 0;
    padding: 16px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    overflow: auto;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
