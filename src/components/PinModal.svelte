<script lang="ts">
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";

    interface Props {
        open: boolean;
        title?: string;
        onsubmit: (pin: string) => void;
        oncancel: () => void;
    }

    let {open, title = "Enter PIN", onsubmit, oncancel}: Props = $props();

    let pin = $state("");
    let error = $state<string | null>(null);

    function handleSubmit() {
        if (pin.length < 4) {
            error = "PIN must be at least 4 characters";
            return;
        }
        error = null;
        onsubmit(pin);
        pin = "";
    }

    function handleClose() {
        pin = "";
        error = null;
        oncancel();
    }
</script>

<Modal {open} {title} onclose={handleClose}>
    <form class="pin-form u-flex-column" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <label>
            PIN
            <!-- svelte-ignore a11y_autofocus -->
            <input
                type="password"
                bind:value={pin}
                placeholder="Enter PIN"
                required
                autofocus
                minlength="4"
            />
        </label>

        {#if error}
            <div class="error">{error}</div>
        {/if}

        <div class="actions">
            <Button kind="secondary" type="button" onclick={handleClose}>Cancel</Button>
            <Button type="submit">Confirm</Button>
        </div>
    </form>
</Modal>

<style>
    .pin-form {
        gap: var(--spacer-1);
    }

    label {
        display: flex;
        flex-direction: column;
        gap: var(--spacer-025);
        color: var(--text-secondary);
    }

    input {
        width: 100%;
    }

    .error {
        color: var(--warning-color);
        font-size: var(--font-size-small);
    }

    .actions {
        display: flex;
        gap: var(--spacer-05);
        margin-top: var(--spacer-1);
    }

    .actions :global(button) {
        flex: 1;
    }
</style>
