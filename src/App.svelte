<script lang="ts">
  import { onMount } from "svelte";
  import ConnectionPicker from "./connections/ConnectionPicker.svelte";
  import ConnectionForm from "./connections/ConnectionForm.svelte";
  import TabBar from "./components/TabBar.svelte";
  import ExecutionPanel from "./query/ExecutionPanel.svelte";
  import Modal from "./components/Modal.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";
  import {
    savedConnections,
    activeConnection,
    isConnected,
    connectionStatus,
  } from "./lib/stores";
  import { getSavedConnections, getConnectionStatus } from "./lib/api";
  import type { ConnectionConfig } from "./lib/types";

  let showConnectionModal = $state(false);
  let editingConnection = $state<ConnectionConfig | null>(null);

  onMount(async () => {
    const connections = await getSavedConnections();
    savedConnections.set(connections);

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

  function handleAddNew() {
    editingConnection = null;
    showConnectionModal = true;
  }

  function handleEdit(config: ConnectionConfig) {
    editingConnection = config;
    showConnectionModal = true;
  }

  function handleModalClose() {
    showConnectionModal = false;
    editingConnection = null;
  }

  function handleSave() {
    showConnectionModal = false;
    editingConnection = null;
  }
</script>

<ToastContainer />

{#if $isConnected}
  <div class="app-layout">
    <TabBar />
    <ExecutionPanel />
  </div>
{:else}
  <ConnectionPicker onAddNew={handleAddNew} onEdit={handleEdit} />
{/if}

<Modal open={showConnectionModal} onclose={handleModalClose}>
  <ConnectionForm editConfig={editingConnection} onsave={handleSave} />
</Modal>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
