<script lang="ts">
    import {savedConnections} from "../lib/stores";
    import {saveConnection, getSavedConnections} from "../lib/api";
    import type {ConnectionConfig} from "../lib/types";
    import Button from "../components/Button.svelte";
    import TestConnectionButton from "./TestConnectionButton.svelte";
    import StandardConnectionFields from "./StandardConnectionFields.svelte";
    import CosmosConnectionFields from "./CosmosConnectionFields.svelte";

    interface Props {
        editConfig?: ConnectionConfig | null;
        onsave?: () => void;
    }

    let {editConfig = null, onsave}: Props = $props();

    let saving = $state(false);
    let selectedType = $state<"standard" | "cosmos" | null>(null);
    let currentConfig = $state<ConnectionConfig | null>(null);
    let testError = $state<string | null>(null);

    // Update selectedType when editConfig changes (e.g., when opening edit modal)
    $effect(() => {
        selectedType = editConfig?.type ?? null;
    });

    function selectType(type: "standard" | "cosmos") {
        selectedType = type;
    }

    function handleConfigChange(config: ConnectionConfig) {
        currentConfig = config;
        testError = null;
    }

    function handleTestError(error: string | null) {
        testError = error;
    }

    async function handleSave() {
        if (!currentConfig) return;

        saving = true;
        try {
            await saveConnection(currentConfig);
            const connections = await getSavedConnections();
            savedConnections.set(connections);
            onsave?.();
        } finally {
            saving = false;
        }
    }
</script>

{#if selectedType === null}
    <div class="type-selector">
        <p class="type-prompt">Select connection type:</p>
        <div class="type-buttons">
            <Button kind="secondary" onclick={() => selectType("standard")}>Standard</Button>
            <Button kind="secondary" onclick={() => selectType("cosmos")}>Cosmos DB</Button>
        </div>
    </div>
{:else}
    <form class="connection-form" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {#if selectedType === "standard"}
            <StandardConnectionFields
                    initial={editConfig?.type === "standard" ? editConfig : null}
                    onchange={handleConfigChange}
            />
        {:else if selectedType === "cosmos"}
            <CosmosConnectionFields
                    initial={editConfig?.type === "cosmos" ? editConfig : null}
                    onchange={handleConfigChange}
            />
        {/if}


    </form>
    <div class="actions">
        {#if testError}
            <div class="test-error">{testError}</div>
        {/if}
        <div class="form-actions">
            <TestConnectionButton config={currentConfig} onerror={handleTestError}/>
            <Button type="submit" pending={saving}>Save</Button>
        </div>
    </div>
{/if}

<style>
    .type-selector {
        display: flex;
        flex-direction: column;
        gap: var(--spacer-075);
    }

    .type-prompt {
        color: var(--text-secondary);
        margin: 0;
    }

    .type-buttons {
        display: flex;
        gap: var(--spacer-05);
    }

    .type-buttons :global(button) {
        flex: 1;
    }

    .connection-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacer-1);
    }

    .actions {
        display: flex;
        gap: var(--spacer-05);
        flex-direction: column;
    }

    .form-actions {
        display: flex;
        gap: var(--spacer-05);
        margin-top: var(--spacer-2);
    }

    .form-actions :global(button) {
        flex: 1;
    }

    .test-error {
        margin-top: var(--spacer-2);
        padding: var(--spacer-075);
        background-color: var(--bg-tertiary);
        border: 1px solid var(--warning-color);
        border-radius: var(--border-radius);
        color: var(--warning-color);
    }
</style>
