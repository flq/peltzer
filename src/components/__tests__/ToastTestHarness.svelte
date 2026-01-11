<script lang="ts">
  import { toast } from "../../lib/toastStore";
  import ToastContainer from "../ToastContainer.svelte";
</script>

<ToastContainer />

<button onclick={() => toast("Success message", "success")}>
  Show Success
</button>
<button onclick={() => toast("Error message", "error")}>
  Show Error
</button>
