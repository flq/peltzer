import { writable } from "svelte/store";
import type { ConnectionConfig } from "./types";

// Connection state
export const savedConnections = writable<ConnectionConfig[]>([]);
export const activeConnection = writable<ConnectionConfig | null>(null);
export const isConnected = writable(false);
export const connectionStatus = writable("Disconnected");

// Query state
export const queryText = writable("g.V().limit(10)");
export const results = writable("");
export const resultCount = writable("");
export const isExecuting = writable(false);
