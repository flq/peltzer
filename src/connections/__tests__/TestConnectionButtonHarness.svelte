<script lang="ts">
  import TestConnectionButton from "../TestConnectionButton.svelte";
  import ToastContainer from "../../components/ToastContainer.svelte";
  import type { ConnectionConfig } from "../../lib/types";

  const config: ConnectionConfig = {
    type: "standard",
    name: "Test DB",
    host: "localhost",
    port: 8182,
    use_ssl: false,
  };
</script>

<ToastContainer />
<TestConnectionButton {config} />
