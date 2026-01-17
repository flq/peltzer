<script lang="ts">
  import ConnectionsPanel from "./connections/ConnectionsPanel.svelte";
  import ExecutionPanel from "./query/ExecutionPanel.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";
  import { activeConnection, isConnected } from "./lib/stores";
  import { connect, disconnect } from "./lib/api";
  import { toast } from "./lib/toastStore";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import type { ConnectionConfig } from "./lib/types";

  async function handleConnect(config: ConnectionConfig) {
    try {
      await connect(config);
      activeConnection.set(config);
    } catch (e) {
      toast(`Connection error: ${e}`, "error");
      activeConnection.set(null);
      return;
    }
    await getCurrentWindow().setTitle(`Peltzer - connected to «${config.name}»`);
  }

  async function handleDisconnect() {
    try {
      await disconnect();
      activeConnection.set(null);
    } catch (e) {
      toast(`Disconnect error: ${e}`, "error");
      return;
    }
    await getCurrentWindow().setTitle("Peltzer");
  }
</script>

<ToastContainer />

{#if $isConnected}
  <ExecutionPanel onDisconnect={handleDisconnect} />
{:else}
  <ConnectionsPanel onconnect={handleConnect} />
{/if}
