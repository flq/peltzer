import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import { ConnectionConfig } from "./types";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load("connections.json");
  }
  return store;
}

export async function getSavedConnections(): Promise<ConnectionConfig[]> {
  const s = await getStore();
  const connections = await s.get<ConnectionConfig[]>("connections");
  return connections ?? [];
}

export async function saveConnection(config: ConnectionConfig): Promise<void> {
  const s = await getStore();
  const connections = await getSavedConnections();

  const existingIndex = connections.findIndex((c) => c.name === config.name);
  if (existingIndex >= 0) {
    connections[existingIndex] = config;
  } else {
    connections.push(config);
  }

  await s.set("connections", connections);
  await s.save();
}

export async function deleteConnection(name: string): Promise<void> {
  const s = await getStore();
  const connections = await getSavedConnections();
  const filtered = connections.filter((c) => c.name !== name);
  await s.set("connections", filtered);
  await s.save();
}

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
