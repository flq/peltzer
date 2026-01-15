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
</script>

<ToastContainer />
{#if error}
  <div class="test-error">{error}</div>
{/if}
<TestConnectionButton {config} onerror={(e) => error = e} />
