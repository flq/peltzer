import { writable, derived } from "svelte/store";
import type { ConnectionConfig } from "./types";

// Connection state (global - needed across components)
export const savedConnections = writable<ConnectionConfig[]>([]);
export const activeConnection = writable<ConnectionConfig | null>(null);
export const isConnected = derived(activeConnection, ($conn) => $conn !== null);
