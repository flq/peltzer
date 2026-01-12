<script lang="ts">
  import { onMount } from "svelte";
  import { savedConnections } from "../lib/stores";
  import { getSavedConnections, deleteConnection } from "../lib/api";
  import type { ConnectionConfig } from "../lib/types";
  import Button from "../components/Button.svelte";
  import Modal from "../components/Modal.svelte";
  import ConnectionForm from "./ConnectionForm.svelte";

  interface Props {
    onconnect: (config: ConnectionConfig) => void;
  }

  let { onconnect }: Props = $props();

  let showModal = $state(false);
  let editingConnection = $state<ConnectionConfig | null>(null);

  onMount(async () => {
    const connections = await getSavedConnections();
    savedConnections.set(connections);
  });

  function handleAddNew() {
    editingConnection = null;
    showModal = true;
  }

  function handleEdit(config: ConnectionConfig) {
    editingConnection = config;
    showModal = true;
  }

  function handleModalClose() {
    showModal = false;
    editingConnection = null;
  }

  function handleSave() {
    showModal = false;
    editingConnection = null;
  }

  async function handleDelete(name: string) {
    await deleteConnection(name);
    const connections = await getSavedConnections();
    savedConnections.set(connections);
  }
</script>

<div class="connections-panel">
  <div class="panel-container">
    <h1>Connections</h1>

    {#if $savedConnections.length > 0}
      <div class="connection-list">
        {#each $savedConnections as conn (conn.name)}
          <div class="connection-item">
            <Button kind="bare" class="connection-name" onclick={() => onconnect(conn)}>
              {conn.name}
              <span class="connection-host">{conn.host}:{conn.port}</span>
            </Button>
            <div class="connection-actions">
              <Button kind="secondary" onclick={() => handleEdit(conn)}>Edit</Button>
              <Button kind="secondary" onclick={() => handleDelete(conn.name)}>Delete</Button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-connections">No saved connections</p>
    {/if}

    <Button onclick={handleAddNew}>+ New Connection...</Button>
  </div>
</div>

<Modal open={showModal} title={editingConnection ? "Edit Connection" : "New Connection"} onclose={handleModalClose}>
  <ConnectionForm editConfig={editingConnection} onsave={handleSave} />
</Modal>

<style>
  .connections-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 24px;
  }

  .panel-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 400px;
    max-width: 500px;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .connection-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .connection-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
  }

  .connection-item :global(.connection-name) {
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    color: var(--text-primary);
    font-weight: 500;
    text-align: left;
  }

  .connection-item :global(.connection-name:hover) {
    color: var(--accent);
  }

  .connection-host {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
  }

  .connection-actions {
    display: flex;
    gap: 8px;
  }

  .no-connections {
    color: var(--text-secondary);
    text-align: center;
    padding: 24px;
  }
</style>
