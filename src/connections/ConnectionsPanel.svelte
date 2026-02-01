<script lang="ts">
  import {onMount} from "svelte";
  import {savedConnections} from "../lib/stores";
  import {getSavedConnections, deleteConnection, saveConnection, getConnectionWithCredentials} from "../lib/api";
  import {getName} from "../lib/types";
  import type {ConnectionConfig} from "../lib/types";
  import Button from "../components/Button.svelte";
  import Modal from "../components/Modal.svelte";
  import ConnectionForm from "./ConnectionForm.svelte";
  import {PackagePlus, Lock} from "lucide-svelte";

  interface Props {
    onconnect: (config: ConnectionConfig) => void;
  }

  let {onconnect}: Props = $props();

  let showModal = $state(false);
  let editingConnection = $state<ConnectionConfig | null>(null);
  let connectError = $state<string | null>(null);

  onMount(async () => {
    const connections = await getSavedConnections();
    savedConnections.set(connections);
  });

  async function handleConnect(config: ConnectionConfig) {
    connectError = null;
    try {
      const configWithCredentials = await getConnectionWithCredentials(config);
      onconnect(configWithCredentials);
    } catch (err) {
      connectError = err instanceof Error ? err.message : "Failed to unlock credentials";
    }
  }

  async function handleSave(connection: ConnectionConfig) {
    await saveConnection(connection);
    const connections = await getSavedConnections();
    savedConnections.set(connections);
    showModal = false;
    editingConnection = null;
  }

  async function handleDelete(config: ConnectionConfig) {
    await deleteConnection(config.name);
    const connections = await getSavedConnections();
    savedConnections.set(connections);
  }

  function handleEdit(config: ConnectionConfig | null) {
    editingConnection = config;
    showModal = true;
  }

  function handleModalClose() {
    editingConnection = null;
    showModal = false;
  }
</script>

<div class="connections-panel">
  <div class="panel-container u-flex-column">
    <h1>Connections</h1>

    {#if connectError}
      <div class="connect-error">{connectError}</div>
    {/if}

    {#if $savedConnections.length > 0}
      <div class="connection-list u-flex-column">
        {#each $savedConnections as conn (conn.name)}
          <div class="connection-item">
            <Button kind="bare" class="connection-name" onclick={() => handleConnect(conn)}>
              <span class="connection-name-row">
                {conn.name}
                {#if conn.secure_storage}
                  <Lock class="icon-sm lock-icon" aria-label="Secure connection" />
                {/if}
              </span>
              <span class="connection-host">
                {getName(conn)}
              </span>
            </Button>
            <div class="connection-actions">
              <Button kind="secondary" onclick={() => handleEdit(conn)}>Edit</Button>
              <Button kind="secondary" onclick={() => handleDelete(conn)}>Delete</Button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-connections">No saved connections</p>
    {/if}

    <Button onclick={() => handleEdit(null)}>
      <PackagePlus class="icon-md" /> New Connection
    </Button>
  </div>
</div>

<Modal open={showModal} title={editingConnection ? "Edit Connection" : "New Connection"} onclose={handleModalClose}>
  {#key showModal}
    <ConnectionForm defaultConfig={editingConnection} onSave={handleSave}/>
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

  .connect-error {
    padding: var(--spacer-075);
    background-color: var(--bg-tertiary);
    border: 1px solid var(--warning-color);
    border-radius: var(--border-radius);
    color: var(--warning-color);
  }

  .connection-name-row {
    display: flex;
    align-items: center;
    gap: var(--spacer-025);
  }

  .connection-item :global(.lock-icon) {
    color: var(--text-secondary);
    flex-shrink: 0;
  }
</style>
