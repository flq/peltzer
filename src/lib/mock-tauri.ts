// Mock Tauri backend for running the frontend standalone (npm run dev:mock).
// Replaces @tauri-apps/api/core, @tauri-apps/plugin-store, and @tauri-apps/api/window
// via Vite resolve aliases.

import type { ConnectionConfig } from "./types";

// --- In-memory state ---
let connectedConfig: ConnectionConfig | null = null;
const credentials = new Map<string, object>();

const seedConnection: ConnectionConfig = {
  type: "standard",
  name: "Local TinkerPop",
  host: "localhost",
  port: 8182,
  use_ssl: false,
};

const cannedQueryResult = JSON.stringify([
  { id: 1, label: "person", properties: { name: [{ value: "Alice" }], age: [{ value: 30 }] } },
  { id: 2, label: "person", properties: { name: [{ value: "Bob" }], age: [{ value: 25 }] } },
  { id: 3, label: "software", properties: { name: [{ value: "Gremlin" }], lang: [{ value: "java" }] } },
], null, 2);

// --- invoke (replaces @tauri-apps/api/core) ---

export async function invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown> {
  switch (cmd) {
    case "connect":
      connectedConfig = (args?.config as ConnectionConfig) ?? null;
      return "Connected";
    case "disconnect":
      connectedConfig = null;
      return "Disconnected";
    case "get_connection_status":
      return connectedConfig;
    case "test_connection":
      return "Connection successful";
    case "execute_query":
      return cannedQueryResult;
    case "store_credentials":
      credentials.set(args?.connectionName as string, args?.credentials as object);
      return null;
    case "retrieve_credentials":
      return credentials.get(args?.connectionName as string) ?? {};
    case "remove_credentials":
      credentials.delete(args?.connectionName as string);
      return null;
    default:
      console.warn(`[mock-tauri] unhandled invoke: ${cmd}`, args);
      return null;
  }
}

// --- Store (replaces @tauri-apps/plugin-store) ---

const storeData = new Map<string, Map<string, unknown>>();

export class Store {
  private data: Map<string, unknown>;

  private constructor(data: Map<string, unknown>) {
    this.data = data;
  }

  static async load(name: string): Promise<Store> {
    if (!storeData.has(name)) {
      const m = new Map<string, unknown>();
      if (name === "connections.json") {
        m.set("connections", [seedConnection]);
      }
      storeData.set(name, m);
    }
    return new Store(storeData.get(name)!);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.data.get(key) as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
  }

  async save(): Promise<void> {}
}

// --- getCurrentWindow (replaces @tauri-apps/api/window) ---

export function getCurrentWindow() {
  return { setTitle: async () => {} };
}

// --- dialog (replaces @tauri-apps/plugin-dialog) ---

export async function open(_options?: unknown): Promise<string | null> {
  // In mock mode, return null (cancelled). Use Playwright for interactive testing.
  return null;
}

export async function save(_options?: unknown): Promise<string | null> {
  return null;
}

// --- fs (replaces @tauri-apps/plugin-fs) ---

export async function readTextFile(_path: string): Promise<string> {
  return "";
}

export async function writeTextFile(_path: string, _content: string): Promise<void> {}
