<script lang="ts">
  import { testConnection } from "../lib/api";
  import { toast } from "../lib/toastStore";
  import type { ConnectionConfig } from "../lib/types";
  import Button from "../components/Button.svelte";

  interface Props {
    config: ConnectionConfig | null;
    onerror?: (error: string | null) => void;
  }

  let { config, onerror }: Props = $props();
  let testing = $state(false);

  async function handleTest() {
    if (!config) return;
    testing = true;
    onerror?.(null);
    try {
      const result = await testConnection(config);
      toast(result, "success");
    } catch (e) {
      onerror?.(`${e}`);
    } finally {
      testing = false;
    }
  }
</script>

<Button type="button" kind="secondary" pending={testing} onclick={handleTest} disabled={!config}>Test</Button>
