import {
  connect,
  disconnect,
  getConnectionStatus,
  getSavedConnections,
  saveConnection,
  deleteConnection,
  testConnection,
} from "./connection";
import { executeQuery } from "./query";
import { ConnectionConfig } from "./types";

// DOM Elements
let connectionStatus: HTMLElement;
let savedConnectionsEl: HTMLElement;
let connectionForm: HTMLFormElement;
let queryInput: HTMLTextAreaElement;
let executeBtn: HTMLButtonElement;
let resultsOutput: HTMLElement;
let resultCount: HTMLElement;

let isConnected = false;

function getFormConfig(): ConnectionConfig {
  return {
    name: (document.getElementById("conn-name") as HTMLInputElement).value,
    host: (document.getElementById("conn-host") as HTMLInputElement).value,
    port: parseInt(
      (document.getElementById("conn-port") as HTMLInputElement).value
    ),
    username:
      (document.getElementById("conn-username") as HTMLInputElement).value ||
      undefined,
    password:
      (document.getElementById("conn-password") as HTMLInputElement).value ||
      undefined,
    use_ssl: (document.getElementById("conn-ssl") as HTMLInputElement).checked,
  };
}

function fillFormFromConfig(config: ConnectionConfig) {
  (document.getElementById("conn-name") as HTMLInputElement).value =
    config.name;
  (document.getElementById("conn-host") as HTMLInputElement).value =
    config.host;
  (document.getElementById("conn-port") as HTMLInputElement).value =
    config.port.toString();
  (document.getElementById("conn-username") as HTMLInputElement).value =
    config.username ?? "";
  (document.getElementById("conn-password") as HTMLInputElement).value =
    config.password ?? "";
  (document.getElementById("conn-ssl") as HTMLInputElement).checked =
    config.use_ssl;
}

function updateConnectionStatus(connected: boolean, message?: string) {
  isConnected = connected;
  connectionStatus.className = `connection-status ${connected ? "connected" : "disconnected"}`;
  connectionStatus.textContent = message ?? (connected ? "Connected" : "Disconnected");
  executeBtn.disabled = !connected;
}

async function renderSavedConnections() {
  const connections = await getSavedConnections();
  savedConnectionsEl.innerHTML = "";

  for (const conn of connections) {
    const div = document.createElement("div");
    div.className = "saved-connection";

    const info = document.createElement("span");
    info.className = "connection-info";
    info.textContent = `${conn.name}`;
    info.title = `${conn.host}:${conn.port}`;

    const actions = document.createElement("div");
    actions.className = "connection-actions";

    const connectBtn = document.createElement("button");
    connectBtn.textContent = "Connect";
    connectBtn.onclick = async () => {
      try {
        updateConnectionStatus(false, "Connecting...");
        const result = await connect(conn);
        updateConnectionStatus(true, result);
      } catch (e) {
        updateConnectionStatus(false, `Error: ${e}`);
      }
    };

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      fillFormFromConfig(conn);
      (
        document.querySelector(".connection-form-details") as HTMLDetailsElement
      ).open = true;
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "danger";
    deleteBtn.onclick = async () => {
      await deleteConnection(conn.name);
      await renderSavedConnections();
    };

    actions.appendChild(connectBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    div.appendChild(info);
    div.appendChild(actions);
    savedConnectionsEl.appendChild(div);
  }
}

async function handleExecuteQuery() {
  const query = queryInput.value.trim();
  if (!query) return;

  resultsOutput.textContent = "Executing...";
  resultCount.textContent = "";

  try {
    const result = await executeQuery(query);
    resultsOutput.textContent = result;

    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        resultCount.textContent = `${parsed.length} result(s)`;
      }
    } catch {
      // Not JSON, that's fine
    }
  } catch (e) {
    resultsOutput.textContent = `Error: ${e}`;
    resultCount.textContent = "";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  // Get DOM elements
  connectionStatus = document.getElementById("connection-status")!;
  savedConnectionsEl = document.getElementById("saved-connections")!;
  connectionForm = document.getElementById("connection-form") as HTMLFormElement;
  queryInput = document.getElementById("query-input") as HTMLTextAreaElement;
  executeBtn = document.getElementById("execute-btn") as HTMLButtonElement;
  resultsOutput = document.getElementById("results-output")!;
  resultCount = document.getElementById("result-count")!;

  // Load saved connections
  await renderSavedConnections();

  // Check current connection status
  try {
    const status = await getConnectionStatus();
    if (status) {
      updateConnectionStatus(true, `Connected to ${status.host}:${status.port}`);
    }
  } catch {
    // Not connected
  }

  // Connection form handlers
  connectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const config = getFormConfig();
    await saveConnection(config);
    await renderSavedConnections();
    (
      document.querySelector(".connection-form-details") as HTMLDetailsElement
    ).open = false;
  });

  document
    .getElementById("test-connection-btn")!
    .addEventListener("click", async () => {
      const config = getFormConfig();
      try {
        const result = await testConnection(config);
        alert(result);
      } catch (e) {
        alert(`Test failed: ${e}`);
      }
    });

  // Disconnect on click of status when connected
  connectionStatus.addEventListener("click", async () => {
    if (isConnected) {
      try {
        await disconnect();
        updateConnectionStatus(false);
      } catch (e) {
        console.error("Disconnect error:", e);
      }
    }
  });

  // Query execution
  executeBtn.addEventListener("click", handleExecuteQuery);

  queryInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (isConnected) {
        handleExecuteQuery();
      }
    }
  });
});
