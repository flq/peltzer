<script lang="ts">
  import {
    savedConnections,
    isConnected,
    connectionStatus,
    activeConnection,
  } from "../lib/stores";
  import { connect, deleteConnection, getSavedConnections } from "../lib/api";
  import type { ConnectionConfig } from "../lib/types";

  // Event dispatcher to signal when editing a connection
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{ edit: ConnectionConfig }>();

  async function handleConnect(config: ConnectionConfig) {
    try {
      connectionStatus.set("Connecting...");
      const result = await connect(config);
      isConnected.set(true);
      activeConnection.set(config);
      connectionStatus.set(result);
    } catch (e) {
      isConnected.set(false);
      connectionStatus.set(`Error: ${e}`);
    }
  }

  async function handleDelete(name: string) {
    await deleteConnection(name);
    const connections = await getSavedConnections();
    savedConnections.set(connections);
  }

  function handleEdit(config: ConnectionConfig) {
    dispatch("edit", config);
  }
</script>

<div class="connection-list">
  {#each $savedConnections as conn (conn.name)}
    <div class="saved-connection">
      <span class="connection-info" title="{conn.host}:{conn.port}">
        {conn.name}
      </span>
      <div class="connection-actions">
        <button on:click={() => handleConnect(conn)}>Connect</button>
        <button on:click={() => handleEdit(conn)}>Edit</button>
        <button class="danger" on:click={() => handleDelete(conn.name)}>Delete</button>
      </div>
    </div>
  {/each}
</div>

<style>
  .connection-list {
    flex: 1;
    overflow-y: auto;
  }

  .saved-connection {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .connection-info {
    font-weight: 500;
    color: var(--text-primary);
  }

  .connection-actions {
    display: flex;
    gap: 6px;
  }

  .connection-actions button {
    padding: 4px 8px;
    font-size: 11px;
  }

  button.danger {
    background-color: transparent;
    border-color: var(--border-color);
    color: var(--text-secondary);
  }

  button.danger:hover {
    background-color: var(--error);
    border-color: var(--error);
    color: white;
  }
</style>
