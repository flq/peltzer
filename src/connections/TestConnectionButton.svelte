<script lang="ts">
  import { testConnection } from "../lib/api";
  import { toast } from "../lib/toastStore";
  import type { ConnectionConfig } from "../lib/types";
  import Button from "../components/Button.svelte";

  interface Props {
    config: ConnectionConfig | null;
  }

  let { config }: Props = $props();
  let testing = $state(false);

  async function handleTest() {
    if (!config) return;
    testing = true;
    try {
      const result = await testConnection(config);
      toast(result, "success");
    } catch (e) {
      toast(`Test failed: ${e}`, "error");
    } finally {
      testing = false;
    }
  }
</script>

<Button type="button" kind="secondary" pending={testing} onclick={handleTest} disabled={!config}>Test</Button>
