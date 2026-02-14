<script lang="ts">
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";
    import StatusMessage from "./StatusMessage.svelte";

    interface Props {
        open: boolean;
        title?: string;
        error?: string | null;
        pending?: boolean;
        onsubmit: (pin: string) => void;
        oncancel: () => void;
        onclearerror?: () => void;
    }

    let {
        open,
        title = "Enter PIN",
        error = null,
        pending = false,
        onsubmit,
        oncancel,
        onclearerror
    }: Props = $props();

    let pin = $state("");
    let validationError = $state<string | null>(null);

    function handleSubmit() {
        if (pin.length < 4) {
            validationError = "PIN must be at least 4 characters";
            return;
        }
        validationError = null;
        onsubmit(pin);
    }

    function handleInput() {
        validationError = null;
        onclearerror?.();
    }

    function handleClose() {
        pin = "";
        validationError = null;
        oncancel();
    }

    // Reset pin when modal closes
    $effect(() => {
        if (!open) {
            pin = "";
            validationError = null;
        }
    });

    let displayError = $derived(validationError || error);
</script>

<Modal {open} {title} onclose={handleClose}>
    <form class="pin-form u-flex-column" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <label>
            PIN
            <!-- svelte-ignore a11y_autofocus -->
            <input
                type="password"
                bind:value={pin}
                oninput={handleInput}
                placeholder="Enter PIN"
                required
                autofocus
                minlength="4"
                disabled={pending}
            />
        </label>

        {#if displayError}
            <StatusMessage type="error" message={displayError} />
        {/if}

        <div class="actions">
            <Button kind="secondary" type="button" onclick={handleClose} disabled={pending}>Cancel</Button>
            <Button type="submit" {pending}>Confirm</Button>
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

    .actions {
        display: flex;
        gap: var(--spacer-05);
        margin-top: var(--spacer-1);
    }

    .actions :global(button) {
        flex: 1;
    }
</style>
