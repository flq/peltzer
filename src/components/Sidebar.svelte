<script lang="ts">
  import ConnectionForm from "./ConnectionForm.svelte";
  import ConnectionList from "./ConnectionList.svelte";
  import {
    isConnected,
    connectionStatus,
  } from "../lib/stores";
  import { disconnect } from "../lib/api";

  async function handleDisconnect() {
    if ($isConnected) {
      try {
        await disconnect();
        isConnected.set(false);
        connectionStatus.set("Disconnected");
      } catch (e) {
        console.error("Disconnect error:", e);
      }
    }
  }
</script>

<aside class="sidebar">
  <h2>Connections</h2>

  <button
    class="connection-status"
    class:connected={$isConnected}
    class:disconnected={!$isConnected}
    on:click={handleDisconnect}
    title={$isConnected ? "Click to disconnect" : ""}
  >
    {$connectionStatus}
  </button>

  <ConnectionList />

  <details class="connection-form-details">
    <summary>New Connection</summary>
    <ConnectionForm />
  </details>
</aside>

<style>
  .sidebar {
    width: 280px;
    min-width: 280px;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .sidebar h2 {
    padding: 16px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    margin: 0;
  }

  .connection-status {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    text-align: left;
    width: 100%;
    border-radius: 0;
  }

  .connection-status.connected {
    background-color: rgba(78, 201, 176, 0.1);
    color: var(--success);
  }

  .connection-status.disconnected {
    background-color: rgba(128, 128, 128, 0.1);
    color: var(--text-secondary);
    cursor: default;
  }

  .connection-status.connected:hover {
    background-color: rgba(241, 76, 76, 0.1);
  }

  .connection-form-details {
    border-top: 1px solid var(--border-color);
  }

  .connection-form-details summary {
    padding: 12px 16px;
    cursor: pointer;
    color: var(--accent);
    font-weight: 500;
  }

  .connection-form-details summary:hover {
    color: var(--accent-hover);
  }
</style>
