import { writable } from "svelte/store";
import type { ConnectionConfig } from "./types";

// Connection state (global - needed across sidebar and execution panel)
export const savedConnections = writable<ConnectionConfig[]>([]);
export const activeConnection = writable<ConnectionConfig | null>(null);
export const isConnected = writable(false);
export const connectionStatus = writable("Disconnected");
