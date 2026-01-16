<script lang="ts">
    import type {StandardConnectionConfig} from "../lib/types";

    interface Props {
        initial?: StandardConnectionConfig | null;
        onchange: (config: StandardConnectionConfig) => void;
    }

    let {initial = null, onchange}: Props = $props();

    let localValues = $state((() => initial)() ?? {
        type: "standard",
        name: "",
        host: "localhost",
        port: 8182,
        username: "",
        password: "",
        use_ssl: false,
    } satisfies StandardConnectionConfig);

    $effect(() => {
        onchange(localValues);
    });
</script>

<label>
    Name
    <!-- svelte-ignore a11y_autofocus -->
    <input type="text" bind:value={localValues.name} placeholder="My Database" required autofocus />
</label>
<label>
    Host
    <input type="text" bind:value={localValues.host} placeholder="localhost" required/>
</label>
<label>
    Port
    <input type="number" bind:value={localValues.port} required/>
</label>
<label>
    Username
    <input type="text" bind:value={localValues.username} placeholder="(optional)"/>
</label>
<label>
    Password
    <input type="password" bind:value={localValues.password} placeholder="(optional)"/>
</label>
<label class="checkbox-label">
    <input type="checkbox" bind:checked={localValues.use_ssl}/>
    Use SSL/TLS
</label>

<style>
    label {
        display: flex;
        flex-direction: column;
        gap: var(--spacer-025);
        color: var(--text-secondary);
    }

    label.checkbox-label {
        margin-top: var(--spacer-1);
        flex-direction: row;
        align-items: center;
        gap: var(--spacer-05);
    }

    input[type="text"],
    input[type="password"],
    input[type="number"] {
        width: 100%;
    }
</style>
