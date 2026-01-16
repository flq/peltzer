<script lang="ts">
    import type {CosmosConnectionConfig} from "../lib/types";

    interface Props {
        initial?: CosmosConnectionConfig | null;
        onchange: (config: CosmosConnectionConfig) => void;
    }

    let {initial = null, onchange}: Props = $props();

    let localValues = $state((() => initial)() ?? {
        type: "cosmos",
        name: "",
        endpoint: "",
        database: "",
        container: "",
        key: "",
    } satisfies CosmosConnectionConfig);

    $effect(() => {
        onchange(localValues);
    });
</script>

<label>
    Name
    <!-- svelte-ignore a11y_autofocus -->
    <input type="text" bind:value={localValues.name} placeholder="My Cosmos DB" required autofocus/>
</label>
<label>
    Endpoint
    <input
            type="text"
            bind:value={localValues.endpoint}
            placeholder="myaccount.gremlin.cosmos.azure.com"
            required
    />
</label>
<label>
    Database
    <input type="text" bind:value={localValues.database} placeholder="graphdb" required/>
</label>
<label>
    Container
    <input type="text" bind:value={localValues.container} placeholder="mygraph" required/>
</label>
<label>
    Key
    <input type="password" bind:value={localValues.key} placeholder="Primary key" required/>
</label>

<style>
    label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: var(--text-secondary);
    }

    input[type="text"],
    input[type="password"] {
        width: 100%;
    }
</style>
