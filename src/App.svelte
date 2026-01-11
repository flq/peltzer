<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import ExecutionPanel from "./components/ExecutionPanel.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";
  import {
    savedConnections,
    activeConnection,
    isConnected,
    connectionStatus,
  } from "./lib/stores";
  import { getSavedConnections, getConnectionStatus } from "./lib/api";

  onMount(async () => {
    // Load saved connections
    const connections = await getSavedConnections();
    savedConnections.set(connections);

    // Check if already connected
    try {
      const status = await getConnectionStatus();
      if (status) {
        activeConnection.set(status);
        isConnected.set(true);
        connectionStatus.set(`Connected to ${status.host}:${status.port}`);
      }
    } catch {
      // Not connected
    }
  });
</script>

<ToastContainer />
<div class="app-layout">
  <Sidebar />
  <ExecutionPanel />
</div>

<style>
  .app-layout {
    display: flex;
    height: 100vh;
  }
</style>
