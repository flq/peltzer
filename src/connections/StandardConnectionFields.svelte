<script lang="ts">
  import type { StandardConnectionConfig } from "../lib/types";

  interface Props {
    initial?: StandardConnectionConfig | null;
    onchange: (config: StandardConnectionConfig) => void;
  }

  let { initial = null, onchange }: Props = $props();

  let name = $state(initial?.name ?? "");
  let host = $state(initial?.host ?? "localhost");
  let port = $state(initial?.port ?? 8182);
  let username = $state(initial?.username ?? "");
  let password = $state(initial?.password ?? "");
  let useSsl = $state(initial?.use_ssl ?? false);

  $effect(() => {
    const config: StandardConnectionConfig = {
      type: "standard",
      name,
      host,
      port,
      username: username || undefined,
      password: password || undefined,
      use_ssl: useSsl,
    };
    onchange(config);
  });
</script>

<div class="fields">
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
</div>

<style>
  .fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fields label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .fields label.checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .fields input[type="text"],
  .fields input[type="password"],
  .fields input[type="number"] {
    width: 100%;
  }
</style>
