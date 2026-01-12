<script lang="ts">
  import { activeConnection, isConnected, connectionStatus } from "../lib/stores";
  import { disconnect } from "../lib/api";

  async function handleClose() {
    try {
      await disconnect();
      isConnected.set(false);
      activeConnection.set(null);
      connectionStatus.set("Disconnected");
    } catch (e) {
      console.error("Disconnect error:", e);
    }
  }
</script>

<div class="tab-bar">
  <div class="tab active">
    <span class="tab-name">{$activeConnection?.name ?? "Connection"}</span>
    <button class="tab-close" onclick={handleClose} type="button" title="Disconnect">×</button>
  </div>
</div>

<style>
  .tab-bar {
    display: flex;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding-left: 8px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    margin-top: 4px;
  }

  .tab-name {
    font-size: 13px;
    color: var(--text-primary);
  }

  .tab-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 16px;
    line-height: 1;
    padding: 2px 4px;
    cursor: pointer;
    border-radius: 4px;
  }

  .tab-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
</style>
