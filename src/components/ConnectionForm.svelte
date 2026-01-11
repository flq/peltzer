<script lang="ts">
  import { savedConnections } from "../lib/stores";
  import { saveConnection, testConnection, getSavedConnections } from "../lib/api";
  import type { ConnectionConfig } from "../lib/types";

  let name = "";
  let host = "localhost";
  let port = 8182;
  let username = "";
  let password = "";
  let useSsl = false;

  export function fillForm(config: ConnectionConfig) {
    name = config.name;
    host = config.host;
    port = config.port;
    username = config.username ?? "";
    password = config.password ?? "";
    useSsl = config.use_ssl;
  }

  function getConfig(): ConnectionConfig {
    return {
      name,
      host,
      port,
      username: username || undefined,
      password: password || undefined,
      use_ssl: useSsl,
    };
  }

  async function handleSave() {
    const config = getConfig();
    await saveConnection(config);
    const connections = await getSavedConnections();
    savedConnections.set(connections);
    clearForm();
  }

  async function handleTest() {
    const config = getConfig();
    try {
      const result = await testConnection(config);
      alert(result);
    } catch (e) {
      alert(`Test failed: ${e}`);
    }
  }

  function clearForm() {
    name = "";
    host = "localhost";
    port = 8182;
    username = "";
    password = "";
    useSsl = false;
  }
</script>

<form class="connection-form" on:submit|preventDefault={handleSave}>
  <label>
    Name
    <input type="text" bind:value={name} placeholder="My Database" required />
  </label>
  <label>
    Host
    <input type="text" bind:value={host} placeholder="localhost" required />
  </label>
  <label>
    Port
    <input type="number" bind:value={port} required />
  </label>
  <label>
    Username
    <input type="text" bind:value={username} placeholder="(optional)" />
  </label>
  <label>
    Password
    <input type="password" bind:value={password} placeholder="(optional)" />
  </label>
  <label class="checkbox-label">
    <input type="checkbox" bind:checked={useSsl} />
    Use SSL/TLS
  </label>
  <div class="form-actions">
    <button type="button" on:click={handleTest}>Test</button>
    <button type="submit">Save</button>
  </div>
</form>

<style>
  .connection-form {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .connection-form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .connection-form label.checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .connection-form input[type="text"],
  .connection-form input[type="password"],
  .connection-form input[type="number"] {
    width: 100%;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .form-actions button {
    flex: 1;
  }
</style>
