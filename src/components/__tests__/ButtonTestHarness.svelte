<script lang="ts">
  import Button from "../Button.svelte";

  interface Props {
    pending?: boolean;
  }

  let { pending = false }: Props = $props();
  let clickCount = $state(0);
</script>

<Button {pending} onclick={() => clickCount++}>Click me</Button>
<p>Clicked: {clickCount}</p>
