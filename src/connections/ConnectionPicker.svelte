<script lang="ts">
  import {
    savedConnections,
    isConnected,
    connectionStatus,
    activeConnection,
  } from "../lib/stores";
  import { connect, deleteConnection, getSavedConnections } from "../lib/api";
  import type { ConnectionConfig } from "../lib/types";
  import Button from "../components/Button.svelte";

  interface Props {
    onAddNew: () => void;
    onEdit: (config: ConnectionConfig) => void;
  }

  let { onAddNew, onEdit }: Props = $props();

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
</script>

<div class="connection-picker">
  <div class="picker-container">
    <h1>Connections</h1>

    {#if $savedConnections.length > 0}
      <div class="connection-list">
        {#each $savedConnections as conn (conn.name)}
          <div class="connection-item">
            <button class="connection-name" onclick={() => handleConnect(conn)}>
              {conn.name}
              <span class="connection-host">{conn.host}:{conn.port}</span>
            </button>
            <div class="connection-actions">
              <Button kind="secondary" onclick={() => onEdit(conn)}>Edit</Button>
              <Button kind="secondary" onclick={() => handleDelete(conn.name)}>Delete</Button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-connections">No saved connections</p>
    {/if}

    <Button onclick={onAddNew}>+ New Connection...</Button>
  </div>
</div>

<style>
  .connection-picker {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 24px;
  }

  .picker-container {
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

  .connection-name {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .connection-name:hover {
    color: var(--accent);
    background: transparent;
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
