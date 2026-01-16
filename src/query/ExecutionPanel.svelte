<script lang="ts">
  import QueryPane from "./QueryPane.svelte";
  import ResultsPane from "./ResultsPane.svelte";
  import { executeQuery } from "../lib/api";
  import { isConnected } from "../lib/stores";

  interface Props {
    onDisconnect: () => void;
  }

  let { onDisconnect }: Props = $props();

  let isExecuting = $state(false);
  let results = $state("");
  let resultCount = $state("");

  async function handleExecute(query: string) {
    if (!query || !$isConnected) return;

    isExecuting = true;

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

<div class="execution-panel u-flex-column">
  <QueryPane
    disabled={!$isConnected}
    {isExecuting}
    onexecute={handleExecute}
    {onDisconnect}
  />
  <ResultsPane {results} {resultCount} loading={isExecuting} />
</div>

<style>
  .execution-panel {
    height: 100%;
    overflow: hidden;
  }
</style>
