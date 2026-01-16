<script lang="ts">
  import { testConnection } from "../lib/api";
  import type { ConnectionConfig } from "../lib/types";
  import Button from "../components/Button.svelte";

  interface Props {
    config: ConnectionConfig | null;
    onsuccess?: (message: string) => void;
    onerror?: (error: string | null) => void;
  }

  let { config, onsuccess, onerror }: Props = $props();
  let testing = $state(false);

  async function handleTest() {
    if (!config) return;
    testing = true;
    onerror?.(null);
    try {
      const result = await testConnection(config);
      onsuccess?.(result);
    } catch (e) {
      onerror?.(`${e}`);
    } finally {
      testing = false;
    }
  }
</script>

<Button type="button" kind="secondary" pending={testing} onclick={handleTest} disabled={!config}>Test</Button>
