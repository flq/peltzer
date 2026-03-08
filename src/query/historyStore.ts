import { writable, get } from "svelte/store";
import { Store } from "@tauri-apps/plugin-store";

export interface HistoryEntry {
  query: string;
}

const MAX_HISTORY = 50;
const STORE_KEY = "history";
const STORE_FILE = "history.json";

let tauriStore: Store | null = null;

// Lazy initialization matches the pattern used in api.ts and avoids top-level
// await, which is incompatible with the configured build target environments.
async function getStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await Store.load(STORE_FILE);
  }
  return tauriStore;
}

function createHistoryStore() {
  const { subscribe, update, set } = writable<HistoryEntry[]>([]);

  const self = {
    subscribe,

    add(query: string) {
      update((entries) => {
        const deduped = entries.filter((e) => e.query !== query);
        return [{ query }, ...deduped].slice(0, MAX_HISTORY);
      });
      const current = get(self);
      if (current.length > 0 && current.length % 5 === 0) {
        self.persist();
      }
    },

    async load() {
      const s = await getStore();
      const entries = await s.get<HistoryEntry[]>(STORE_KEY);
      set(entries ?? []);
    },

    async persist() {
      const entries = get(self);
      const s = await getStore();
      await s.set(STORE_KEY, entries);
      await s.save();
    },

    clear() {
      set([]);
    },
  };

  return self;
}

export const historyStore = createHistoryStore();
