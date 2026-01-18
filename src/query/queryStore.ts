import { writable } from "svelte/store";

export interface TabResult {
  results: string;
  resultCount: string;
  isExecuting: boolean;
}

export interface QueryState {
  activeTabId: string | null;
  activeQuery: string;
  tabResults: Map<string, TabResult>;
}

function createQueryStore() {
  const { subscribe, update, set } = writable<QueryState>({
    activeTabId: null,
    activeQuery: "",
    tabResults: new Map(),
  });

  return {
    subscribe,

    setActiveTab(tabId: string, query: string) {
      update((state) => ({
        ...state,
        activeTabId: tabId,
        activeQuery: query,
      }));
    },

    updateActiveQuery(query: string) {
      update((state) => ({
        ...state,
        activeQuery: query,
      }));
    },

    setExecuting(tabId: string) {
      update((state) => {
        const tabResults = new Map(state.tabResults);
        const existing = tabResults.get(tabId) || { results: "", resultCount: "", isExecuting: false };
        tabResults.set(tabId, { ...existing, isExecuting: true });
        return { ...state, tabResults };
      });
    },

    setResult(tabId: string, results: string, resultCount: string) {
      update((state) => {
        const tabResults = new Map(state.tabResults);
        tabResults.set(tabId, { results, resultCount, isExecuting: false });
        return { ...state, tabResults };
      });
    },

    clearTab(tabId: string) {
      update((state) => {
        const tabResults = new Map(state.tabResults);
        tabResults.delete(tabId);
        return { ...state, tabResults };
      });
    },

    reset() {
      set({
        activeTabId: null,
        activeQuery: "",
        tabResults: new Map(),
      });
    },
  };
}

export const queryStore = createQueryStore();
