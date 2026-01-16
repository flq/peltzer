<script lang="ts">
    import {savedConnections} from "../lib/stores";
    import {saveConnection, getSavedConnections} from "../lib/api";
    import type {ConnectionConfig} from "../lib/types";
    import Button from "../components/Button.svelte";
    import TestConnectionButton from "./TestConnectionButton.svelte";
    import StandardConnectionFields from "./StandardConnectionFields.svelte";
    import CosmosConnectionFields from "./CosmosConnectionFields.svelte";

    interface Props {
        defaultConfig?: ConnectionConfig | null;
        onSave?: () => void;
    }

    let {defaultConfig = null, onSave}: Props = $props();

    let saving = $state(false);
    let selectedType = $state<"standard" | "cosmos" | null>(null);
    let currentConfig = $state<ConnectionConfig | null>(null);
    let testError = $state<string | null>(null);
    let testSuccess = $state<string | null>(null);

    // Update selectedType when editConfig changes (e.g., when opening edit modal)
    $effect(() => {
        selectedType = defaultConfig?.type ?? null;
    });

    function selectType(type: "standard" | "cosmos") {
        selectedType = type;
    }

    function handleConfigChange(config: ConnectionConfig) {
        currentConfig = config;
        testError = null;
        testSuccess = null;
    }

    function handleTestSuccess(message: string) {
        testSuccess = message;
        testError = null;
    }

    function handleTestError(error: string | null) {
        testError = error;
        testSuccess = null;
    }

    async function handleSave() {
        if (!currentConfig) return;

        saving = true;
        try {
            await saveConnection(currentConfig);
            const connections = await getSavedConnections();
            savedConnections.set(connections);
            onSave?.();
        } finally {
            saving = false;
        }
    }
</script>

{#if selectedType === null}
    <div class="type-selector u-flex-column">
        <p class="type-prompt">Select connection type:</p>
        <div class="type-buttons">
            <Button kind="secondary" onclick={() => selectType("standard")}>Standard</Button>
            <Button kind="secondary" onclick={() => selectType("cosmos")}>Cosmos DB</Button>
        </div>
    </div>
{:else}
    <form class="connection-form u-flex-column" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {#if selectedType === "standard"}
            <StandardConnectionFields
                    initial={defaultConfig?.type === "standard" ? defaultConfig : null}
                    onchange={handleConfigChange}
            />
        {:else if selectedType === "cosmos"}
            <CosmosConnectionFields
                    initial={defaultConfig?.type === "cosmos" ? defaultConfig : null}
                    onchange={handleConfigChange}
            />
        {/if}

        <div class="actions u-flex-column">
            {#if testSuccess}
                <div class="test-success">{testSuccess}</div>
            {:else if testError}
                <div class="test-error">{testError}</div>
            {/if}
            <div class="form-actions">
                <TestConnectionButton config={currentConfig} onsuccess={handleTestSuccess} onerror={handleTestError}/>
                <Button type="submit" pending={saving}>Save</Button>
            </div>
        </div>
    </form>
{/if}

<style>
    .type-selector {
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
        gap: var(--spacer-1);
    }

    .actions {
        gap: var(--spacer-05);
    }

    .form-actions {
        display: flex;
        gap: var(--spacer-05);
        margin-top: var(--spacer-2);
    }

    .form-actions :global(button) {
        flex: 1;
    }

    .test-success,
    .test-error {
        margin-top: var(--spacer-15);
        padding: var(--spacer-075);
        background-color: var(--bg-tertiary);
        border-radius: var(--border-radius);
    }

    .test-success {
        border: 1px solid var(--success-color);
        color: var(--success-color);
    }

    .test-error {
        border: 1px solid var(--warning-color);
        color: var(--warning-color);
    }
</style>
