import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import { mockStoreGet, mockStoreSet, mockStoreSave } from "../../test/setup";

// Import after mocks are set up
let historyStore: typeof import("../historyStore").historyStore;

describe("historyStore", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to reset module-level store singleton
    vi.resetModules();
    const mod = await import("../historyStore");
    historyStore = mod.historyStore;
  });

  it("starts empty", () => {
    expect(get(historyStore)).toEqual([]);
  });

  it("add() prepends entries", () => {
    historyStore.add("g.V().count()");
    historyStore.add("g.E().count()");
    const entries = get(historyStore);
    expect(entries[0].query).toBe("g.E().count()");
    expect(entries[1].query).toBe("g.V().count()");
  });

  it("add() deduplicates: moves existing entry to top", () => {
    historyStore.add("g.V().count()");
    historyStore.add("g.E().count()");
    historyStore.add("g.V().count()"); // duplicate
    const entries = get(historyStore);
    expect(entries).toHaveLength(2);
    expect(entries[0].query).toBe("g.V().count()");
    expect(entries[1].query).toBe("g.E().count()");
  });

  it("add() trims to 50 entries", () => {
    for (let i = 0; i < 55; i++) {
      historyStore.add(`g.V().limit(${i})`);
    }
    expect(get(historyStore)).toHaveLength(50);
  });

  it("add() calls persist when length is multiple of 5", async () => {
    // Add 5 distinct entries → length becomes 5 → persist called
    for (let i = 0; i < 5; i++) {
      historyStore.add(`query-${i}`);
    }
    // Flush the microtask queue so the async persist() triggered by add() completes
    await new Promise((r) => setTimeout(r, 0));
    expect(mockStoreSet).toHaveBeenCalled();
    expect(mockStoreSave).toHaveBeenCalled();
  });

  it("add() does not persist when length is not multiple of 5", () => {
    historyStore.add("only-one");
    expect(mockStoreSet).not.toHaveBeenCalled();
  });

  it("load() populates entries from Tauri store", async () => {
    const stored = [{ query: "g.V()" }, { query: "g.E()" }];
    mockStoreGet.mockResolvedValue(stored);
    await historyStore.load();
    expect(get(historyStore)).toEqual(stored);
  });

  it("load() starts empty when store returns null", async () => {
    mockStoreGet.mockResolvedValue(null);
    await historyStore.load();
    expect(get(historyStore)).toEqual([]);
  });

  it("persist() writes current entries to Tauri store", async () => {
    historyStore.add("g.V().count()");
    historyStore.add("g.E().count()");
    vi.clearAllMocks();
    await historyStore.persist();
    expect(mockStoreSet).toHaveBeenCalledWith("history", [
      { query: "g.E().count()" },
      { query: "g.V().count()" },
    ]);
    expect(mockStoreSave).toHaveBeenCalled();
  });

  it("clear() empties the store", () => {
    historyStore.add("g.V().count()");
    historyStore.clear();
    expect(get(historyStore)).toEqual([]);
  });
});
