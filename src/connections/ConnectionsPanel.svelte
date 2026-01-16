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
  <div class="panel-container u-flex-column">
    <h1>Connections</h1>

    {#if $savedConnections.length > 0}
      <div class="connection-list u-flex-column">
        {#each $savedConnections as conn (conn.name)}
          <div class="connection-item">
            <Button kind="bare" class="connection-name" onclick={() => onconnect(conn)}>
              {conn.name}
              <span class="connection-host">
                {#if conn.type === "cosmos"}
                  {conn.endpoint}/{conn.database}
                {:else}
                  {conn.host}:{conn.port}
                {/if}
              </span>
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
  {#key showModal}
    <ConnectionForm defaultConfig={editingConnection} onSave={handleSave} />
  {/key}
</Modal>

<style>
  .connections-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }

  .panel-container {
    gap: var(--spacer-2);
    min-width: 400px;
    max-width: 80%;
  }

  h1 {
    font-size: var(--font-size-large);
    font-weight: 600;
    color: var(--text-primary);
  }

  .connection-list {
    gap: var(--spacer-075);
  }

  .connection-item {
    display: flex;
    align-items: center;
    gap: var(--spacer-075);
    padding: var(--spacer-075) var(--spacer-1);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
  }

  .connection-item :global(.connection-name) {
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    color: var(--text-primary);
    font-weight: 500;
    text-align: left;
    overflow: hidden;
  }

  .connection-item :global(.connection-name:hover) {
    color: var(--accent);
  }

  .connection-host {
    display: block;
    width: 100%;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .connection-actions {
    display: flex;
    gap: var(--spacer-05);
    flex-shrink: 0;
  }

  .no-connections {
    color: var(--text-secondary);
    text-align: center;
    padding: var(--spacer-2);
  }
</style>
