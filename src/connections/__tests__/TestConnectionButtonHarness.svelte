<script lang="ts">
  import TestConnectionButton from "../TestConnectionButton.svelte";
  import ToastContainer from "../../components/ToastContainer.svelte";
  import type { ConnectionConfig } from "../../lib/types";

  const config: ConnectionConfig = {
    type: "standard",
    name: "Test DB",
    host: "localhost",
    port: 8182,
    use_ssl: false,
  };

  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
</script>

<ToastContainer />
{#if success}
  <div class="test-success">{success}</div>
{/if}
{#if error}
  <div class="test-error">{error}</div>
{/if}
<TestConnectionButton {config} onsuccess={(s) => success = s} onerror={(e) => error = e} />
