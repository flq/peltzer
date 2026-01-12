<script lang="ts">
  import { savedConnections } from "../lib/stores";
  import { saveConnection, getSavedConnections } from "../lib/api";
  import type { ConnectionConfig } from "../lib/types";
  import Button from "../components/Button.svelte";
  import TestConnectionButton from "./TestConnectionButton.svelte";

  interface Props {
    editConfig?: ConnectionConfig | null;
    onsave?: () => void;
  }

  let { editConfig = null, onsave }: Props = $props();

  let saving = $state(false);

  let name = $state("");
  let host = $state("localhost");
  let port = $state(8182);
  let username = $state("");
  let password = $state("");
  let useSsl = $state(false);

  $effect(() => {
    name = editConfig?.name ?? "";
    host = editConfig?.host ?? "localhost";
    port = editConfig?.port ?? 8182;
    username = editConfig?.username ?? "";
    password = editConfig?.password ?? "";
    useSsl = editConfig?.use_ssl ?? false;
  });

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
    saving = true;
    try {
      const config = getConfig();
      await saveConnection(config);
      const connections = await getSavedConnections();
      savedConnections.set(connections);
      onsave?.();
    } finally {
      saving = false;
    }
  }
</script>

<form class="connection-form" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
    <TestConnectionButton config={getConfig()} />
    <Button type="submit" pending={saving}>Save</Button>
  </div>
</form>

<style>
  .connection-form {
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

  .form-actions :global(button) {
    flex: 1;
  }
</style>
