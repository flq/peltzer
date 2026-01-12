<script lang="ts">
  import ConnectionsPanel from "./connections/ConnectionsPanel.svelte";
  import ExecutionPanel from "./query/ExecutionPanel.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";
  import { activeConnection, isConnected } from "./lib/stores";
  import { connect, disconnect } from "./lib/api";
  import type { ConnectionConfig } from "./lib/types";

  async function handleConnect(config: ConnectionConfig) {
    try {
      await connect(config);
      activeConnection.set(config);
    } catch (e) {
      activeConnection.set(null);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect();
      activeConnection.set(null);
    } catch (e) {
      console.error("Disconnect error:", e);
    }
  }
</script>

<ToastContainer />

{#if $isConnected}
  <ExecutionPanel ondisconnect={handleDisconnect} />
{:else}
  <ConnectionsPanel onconnect={handleConnect} />
{/if}
