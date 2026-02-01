import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import type {
  ConnectionConfig,
  StandardConnectionConfig,
  CosmosConnectionConfig,
} from "./types";
import * as biometry from "./biometry";
import type { Credentials } from "./biometry";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load("connections.json");
  }
  return store;
}

// Helper to extract sensitive fields from connection config
function extractSensitiveFields(config: ConnectionConfig): {
  sanitized: ConnectionConfig;
  credentials: Credentials;
} {
  if (config.type === "standard") {
    const { username, password, ...rest } = config;
    return {
      sanitized: { ...rest, type: "standard" } as StandardConnectionConfig,
      credentials: { username, password },
    };
  } else {
    const { key, ...rest } = config;
    return {
      sanitized: { ...rest, type: "cosmos" } as CosmosConnectionConfig,
      credentials: { key },
    };
  }
}

// Connection persistence (store)
export async function getSavedConnections(): Promise<ConnectionConfig[]> {
  const s = await getStore();
  const connections = await s.get<ConnectionConfig[]>("connections");
  return connections ?? [];
}

export async function saveConnection(config: ConnectionConfig): Promise<void> {
  const s = await getStore();
  const connections = await getSavedConnections();

  let configToStore = config;

  if (config.secure_storage) {
    const { sanitized, credentials } = extractSensitiveFields(config);
    await biometry.storeCredentials(config.name, credentials);
    configToStore = sanitized;
  }

  const existingIndex = connections.findIndex((c) => c.name === configToStore.name);
  if (existingIndex >= 0) {
    connections[existingIndex] = configToStore;
  } else {
    connections.push(configToStore);
  }

  await s.set("connections", connections);
  await s.save();
}

export async function getConnectionWithCredentials(
  config: ConnectionConfig
): Promise<ConnectionConfig> {
  if (!config.secure_storage) {
    return config;
  }

  const credentials = await biometry.retrieveCredentials(
    config.name,
    `Unlock credentials for "${config.name}"`
  );

  return { ...config, ...credentials };
}

export async function deleteConnection(name: string): Promise<void> {
  const s = await getStore();
  const connections = await getSavedConnections();
  const conn = connections.find((c) => c.name === name);

  if (conn?.secure_storage) {
    try {
      await biometry.removeCredentials(name);
    } catch {
      // Ignore errors if credentials don't exist
    }
  }

  const filtered = connections.filter((c) => c.name !== name);
  await s.set("connections", filtered);
  await s.save();
}

// Connection management (Rust backend)
export async function connect(config: ConnectionConfig): Promise<string> {
  return await invoke<string>("connect", { config });
}

export async function disconnect(): Promise<string> {
  return await invoke<string>("disconnect");
}

export async function getConnectionStatus(): Promise<ConnectionConfig | null> {
  return await invoke<ConnectionConfig | null>("get_connection_status");
}

export async function testConnection(config: ConnectionConfig): Promise<string> {
  return await invoke<string>("test_connection", { config });
}

// Query execution
export async function executeQuery(query: string): Promise<string> {
  return await invoke<string>("execute_query", { query });
}
