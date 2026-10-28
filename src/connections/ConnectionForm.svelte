<script lang="ts">
    import type {ConnectionConfig} from "../lib/types";
    import {errorMessage} from "../lib/errors";
    import Button from "../components/Button.svelte";
    import StatusMessage from "../components/StatusMessage.svelte";
    import TestConnectionButton from "./TestConnectionButton.svelte";
    import StandardConnectionFields from "./StandardConnectionFields.svelte";
    import CosmosConnectionFields from "./CosmosConnectionFields.svelte";

    interface Props {
        defaultConfig?: ConnectionConfig | null;
        onSave?: (connectionConfig: ConnectionConfig) => Promise<void>;
    }

    let {defaultConfig = null, onSave}: Props = $props();

    let saving = $state(false);
    // Resets when defaultConfig changes (e.g. opening the edit modal), but the type buttons can override it
    let selectedType = $derived<"standard" | "cosmos" | null>(defaultConfig?.type ?? null);
    let currentConfig = $state<ConnectionConfig | null>(null);
    let statusError = $state<string | null>(null);
    let statusSuccess = $state<string | null>(null);

    function selectType(type: "standard" | "cosmos") {
        selectedType = type;
    }

    function handleConfigChange(config: ConnectionConfig) {
        currentConfig = config;
        statusError = null;
        statusSuccess = null;
    }

    function handleTestSuccess(message: string) {
        statusSuccess = message;
        statusError = null;
    }

    function handleTestError(error: string | null) {
        statusError = error;
        statusSuccess = null;
    }

    async function handleSave() {
        if (!currentConfig) return;
        saving = true;
        statusError = null;
        statusSuccess = null;
        try {
            await onSave?.(currentConfig);
        } catch (e) {
            statusError = `Failed to save connection: ${errorMessage(e)}`;
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
    <form class="connection-form u-flex-column" onsubmit={(e) => { e.preventDefault(); void handleSave(); }}>
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
            {#if statusSuccess}
                <StatusMessage type="success" message={statusSuccess} />
            {:else if statusError}
                <StatusMessage type="error" message={statusError} />
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
</style>
