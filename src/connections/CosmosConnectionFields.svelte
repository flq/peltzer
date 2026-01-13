<script lang="ts">
  import type { CosmosConnectionConfig } from "../lib/types";

  interface Props {
    initial?: CosmosConnectionConfig | null;
    onchange: (config: CosmosConnectionConfig) => void;
  }

  let { initial = null, onchange }: Props = $props();

  let name = $state(initial?.name ?? "");
  let endpoint = $state(initial?.endpoint ?? "");
  let database = $state(initial?.database ?? "");
  let container = $state(initial?.container ?? "");
  let key = $state(initial?.key ?? "");

  $effect(() => {
    const config: CosmosConnectionConfig = {
      type: "cosmos",
      name,
      endpoint,
      database,
      container,
      key,
    };
    onchange(config);
  });
</script>

<div class="fields">
  <label>
    Name
    <input type="text" bind:value={name} placeholder="My Cosmos DB" required />
  </label>
  <label>
    Endpoint
    <input
      type="text"
      bind:value={endpoint}
      placeholder="myaccount.gremlin.cosmos.azure.com"
      required
    />
  </label>
  <label>
    Database
    <input type="text" bind:value={database} placeholder="graphdb" required />
  </label>
  <label>
    Container
    <input type="text" bind:value={container} placeholder="mygraph" required />
  </label>
  <label>
    Key
    <input type="password" bind:value={key} placeholder="Primary key" required />
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

  .fields input[type="text"],
  .fields input[type="password"] {
    width: 100%;
  }
</style>
