<script lang="ts">
    interface Props {
        type: "success" | "error";
        message: string;
    }

    let { type, message }: Props = $props();
</script>

<div class="status-message" class:success={type === "success"} class:error={type === "error"}>
    {message}
</div>

<style>
    .status-message {
        padding: var(--spacer-075);
        background-color: var(--bg-tertiary);
        border-radius: var(--border-radius);
    }

    .success {
        border: 1px solid var(--success-color);
        color: var(--success-color);
    }

    .error {
        border: 1px solid var(--warning-color);
        color: var(--warning-color);
    }
</style>
