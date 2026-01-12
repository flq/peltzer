<script lang="ts">
  import QueryPane from "./QueryPane.svelte";
  import ResultsPane from "./ResultsPane.svelte";
  import { executeQuery } from "../lib/api";
  import { isConnected } from "../lib/stores";

  interface Props {
    ondisconnect: () => void;
  }

  let { ondisconnect }: Props = $props();

  let isExecuting = $state(false);
  let results = $state("");
  let resultCount = $state("");

  async function handleExecute(query: string) {
    if (!query || !$isConnected) return;

    isExecuting = true;
    results = "Executing...";
    resultCount = "";

    try {
      const result = await executeQuery(query);
      results = result;

      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          resultCount = `${parsed.length} result(s)`;
        }
      } catch {
        // Not JSON, that's fine
      }
    } catch (e) {
      results = `Error: ${e}`;
      resultCount = "";
    } finally {
      isExecuting = false;
    }
  }
</script>

<div class="execution-panel">
  <QueryPane
    disabled={!$isConnected}
    {isExecuting}
    onexecute={handleExecute}
    {ondisconnect}
  />
  <ResultsPane {results} {resultCount} />
</div>

<style>
  .execution-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
