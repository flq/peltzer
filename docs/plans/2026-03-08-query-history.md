# Query History Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a slide-in history panel (Ctrl+H or toolbar button) that records every successfully executed query, persists across sessions, and lets the user reload any past query into the active tab.

**Architecture:** A new `historyStore.ts` (Svelte writable + Tauri plugin-store persistence) tracks up to 50 deduplicated entries. A `HistoryPanel.svelte` component overlays the tab/results area from the right. `ExecutionPanel` wires everything together: recording entries on success, toggling the panel, and handling keyboard shortcuts.

**Tech Stack:** Svelte 5, TypeScript, `@tauri-apps/plugin-store`, `lucide-svelte` (History icon), `svelte/transition` (fly)

---

### Task 1: `historyStore.ts` — state, dedup, trim, persistence

**Files:**
- Create: `src/query/historyStore.ts`
- Create: `src/query/__tests__/historyStore.test.ts`

**Step 1: Write the failing tests**

Create `src/query/__tests__/historyStore.test.ts`:

```ts
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

  it("add() calls persist when length is multiple of 5", () => {
    // Add 5 distinct entries → length becomes 5 → persist called
    for (let i = 0; i < 5; i++) {
      historyStore.add(`query-${i}`);
    }
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
```

**Step 2: Run tests to verify they fail**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/historyStore.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement `src/query/historyStore.ts`**

```ts
import { writable, get } from "svelte/store";
import { Store } from "@tauri-apps/plugin-store";

export interface HistoryEntry {
  query: string;
}

const MAX_HISTORY = 50;
const STORE_KEY = "history";
const STORE_FILE = "history.json";

let tauriStore: Store | null = null;

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
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/historyStore.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/query/historyStore.ts src/query/__tests__/historyStore.test.ts
git commit -m "feat: add historyStore with dedup, trim, and persistence"
```

---

### Task 2: `HistoryPanel.svelte` component

**Files:**
- Create: `src/query/HistoryPanel.svelte`
- Create: `src/query/__tests__/HistoryPanel.test.ts`

**Step 1: Write the failing tests**

Create `src/query/__tests__/HistoryPanel.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import HistoryPanel from "../HistoryPanel.svelte";
import type { HistoryEntry } from "../historyStore";

const entries: HistoryEntry[] = [
  { query: "g.V().count()" },
  { query: "g.E().hasLabel('knows').count()" },
];

const defaultProps = {
  entries,
  onClose: vi.fn(),
  onSelectEntry: vi.fn(),
};

describe("HistoryPanel", () => {
  it("renders history entries", () => {
    render(HistoryPanel, { props: defaultProps });
    expect(screen.getByText("g.V().count()")).toBeInTheDocument();
    expect(screen.getByText("g.E().hasLabel('knows').count()")).toBeInTheDocument();
  });

  it("shows empty state when no entries", () => {
    render(HistoryPanel, { props: { ...defaultProps, entries: [] } });
    expect(screen.getByText("No history yet")).toBeInTheDocument();
  });

  it("truncates long queries to 80 chars with ellipsis", () => {
    const longQuery = "g.V().has('name', 'marko').out('knows').out('knows').values('name').dedup().fold()_extra";
    render(HistoryPanel, { props: { ...defaultProps, entries: [{ query: longQuery }] } });
    const text = screen.getByRole("button", { name: /g\.V/ }).textContent ?? "";
    expect(text.length).toBeLessThanOrEqual(82); // 80 + "…"
    expect(text).toContain("…");
  });

  it("calls onSelectEntry and onClose when entry is clicked", async () => {
    const onClose = vi.fn();
    const onSelectEntry = vi.fn();
    render(HistoryPanel, { props: { entries, onClose, onSelectEntry } });

    await fireEvent.click(screen.getByText("g.V().count()"));

    expect(onSelectEntry).toHaveBeenCalledWith("g.V().count()");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(HistoryPanel, { props: { ...defaultProps, onClose } });

    await fireEvent.click(screen.getByRole("button", { name: /close history/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(HistoryPanel, { props: { ...defaultProps, onClose } });

    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders History heading", () => {
    render(HistoryPanel, { props: defaultProps });
    expect(screen.getByText("History")).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/HistoryPanel.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement `src/query/HistoryPanel.svelte`**

```svelte
<script lang="ts">
  import { X } from "lucide-svelte";
  import type { HistoryEntry } from "./historyStore";

  interface Props {
    entries: HistoryEntry[];
    onClose: () => void;
    onSelectEntry: (query: string) => void;
  }

  let { entries, onClose, onSelectEntry }: Props = $props();

  function truncate(text: string, max = 80): string {
    return text.length > max ? text.slice(0, max) + "…" : text;
  }

  function handleSelect(query: string) {
    onSelectEntry(query);
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="history-panel" role="complementary" aria-label="Query History">
  <div class="history-header">
    <span>History</span>
    <button class="close-btn" onclick={onClose} aria-label="Close history">
      <X class="icon-sm" />
    </button>
  </div>
  <div class="history-entries">
    {#if entries.length === 0}
      <p class="empty-state">No history yet</p>
    {:else}
      {#each entries as entry}
        <button class="history-entry" onclick={() => handleSelect(entry.query)}>
          {truncate(entry.query)}
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .history-panel {
    width: 100%;
    height: 100%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-05) var(--spacer-1);
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    flex-shrink: 0;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .close-btn:hover {
    color: var(--text-primary);
  }

  .history-entries {
    flex: 1;
    overflow-y: auto;
  }

  .history-entry {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacer-05) var(--spacer-1);
    cursor: pointer;
    font-family: monospace;
    font-size: 0.85em;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-entry:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  }

  .empty-state {
    padding: var(--spacer-1);
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/HistoryPanel.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/query/HistoryPanel.svelte src/query/__tests__/HistoryPanel.test.ts
git commit -m "feat: add HistoryPanel slide-in component"
```

---

### Task 3: Add `setActiveQuery()` to `TabContainer`

**Files:**
- Modify: `src/query/TabContainer.svelte`
- Modify: `src/query/__tests__/ExecutionPanel.test.ts` (add one test)

**Step 1: Write the failing test**

Add to the `"tabs"` describe block in `src/query/__tests__/ExecutionPanel.test.ts`:

```ts
it("sets active tab query text via history load", async () => {
  activeConnection.set(mockConnection);
  render(ExecutionPanel, { props: defaultProps });

  // Add a second tab so we can see the tab bar for navigation
  const newTabButton = screen.getByRole("button", { name: /new tab/i });
  await fireEvent.click(newTabButton);

  // Type something in second tab
  await fireEvent.input(screen.getByRole("textbox"), { target: { value: "g.E().count()" } });

  // Click the history button to open panel
  const historyButton = screen.getByRole("button", { name: /history/i });
  await fireEvent.click(historyButton);

  // Click the history entry
  const entry = screen.getByText(/g\.E/);
  await fireEvent.click(entry);

  // Active tab should now have that query
  expect(screen.getByRole("textbox")).toHaveValue("g.E().count()");
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/ExecutionPanel.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL

**Step 3: Add `setActiveQuery` export to `src/query/TabContainer.svelte`**

After the existing `export function saveFile()` block (around line 103), add:

```ts
export function setActiveQuery(query: string) {
  updateQueryText(query);
}
```

**Step 4: Commit** (test passes in Task 5 after wiring ExecutionPanel)

```bash
git add src/query/TabContainer.svelte
git commit -m "feat: expose setActiveQuery on TabContainer"
```

---

### Task 4: Add history button to `QueryHeader`

**Files:**
- Modify: `src/query/QueryHeader.svelte`

**Step 1: Update `QueryHeader.svelte`**

Add `History` to the icon imports and add `onToggleHistory` prop and button. Replace the full file content:

In `<script lang="ts">`:
- Add `History` to the lucide import: `import { Play, FilePlusCorner, Unplug, FolderOpen, Save, History } from "lucide-svelte";`
- Add `onToggleHistory: () => void;` to the `Props` interface
- Add `onToggleHistory,` to the destructured props

In the template, add the History button before the Execute button:

```svelte
<Button kind="secondary" onclick={onToggleHistory} title="History (Ctrl+H)">
  <History class="icon-md" />
</Button>
```

**Full updated `src/query/QueryHeader.svelte`:**

```svelte
<script lang="ts">
  import Button from "../components/Button.svelte";
  import { Play, FilePlusCorner, Unplug, FolderOpen, Save, History } from "lucide-svelte";

  interface Props {
    disabled?: boolean;
    isExecuting?: boolean;
    canAddTab?: boolean;
    onExecute: () => void;
    onDisconnect: () => void;
    onAddTab: () => void;
    onOpenFile: () => void;
    onSaveFile: () => void;
    onToggleHistory: () => void;
  }

  let {
    disabled = false,
    isExecuting = false,
    canAddTab = true,
    onExecute,
    onDisconnect,
    onAddTab,
    onOpenFile,
    onSaveFile,
    onToggleHistory,
  }: Props = $props();
</script>

<div class="query-header">
  <h3>Query</h3>
  <div class="query-actions">
    <Button kind="secondary" onclick={onOpenFile} title="Open File (Cmd+O)">
      <FolderOpen class="icon-md" />
    </Button>
    <Button kind="secondary" onclick={onSaveFile} title="Save File (Cmd+S)">
      <Save class="icon-md" />
    </Button>
    <Button kind="secondary" onclick={onToggleHistory} title="History (Ctrl+H)">
      <History class="icon-md" />
    </Button>
    <Button onclick={onExecute} disabled={disabled || isExecuting} pending={isExecuting} title="Execute (Ctrl+Enter)">
      <Play class="icon-md" />
    </Button>
    {#if canAddTab}
      <Button kind="secondary" onclick={onAddTab} title="New Tab (Ctrl+T)">
        <FilePlusCorner class="icon-md" />
      </Button>
    {/if}
    <Button kind="secondary" onclick={onDisconnect} title="Disconnect">
      <Unplug class="icon-md" />
    </Button>
  </div>
</div>

<style>
  .query-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-05) var(--spacer-1);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .query-header h3 {
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .query-actions {
    display: flex;
    gap: var(--spacer-05);
  }
</style>
```

**Step 2: Run all tests to make sure nothing broke**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test
```

Expected: All existing tests PASS (ExecutionPanel tests may fail on history-related assertions — that's expected until Task 5)

**Step 3: Commit**

```bash
git add src/query/QueryHeader.svelte
git commit -m "feat: add History button to QueryHeader toolbar"
```

---

### Task 5: Wire everything in `ExecutionPanel`

**Files:**
- Modify: `src/query/ExecutionPanel.svelte`
- Modify: `src/query/__tests__/ExecutionPanel.test.ts`

**Step 1: Add ExecutionPanel integration tests**

Add a new `describe("history", ...)` block to `src/query/__tests__/ExecutionPanel.test.ts`:

At the top, add the mock:
```ts
import * as historyStoreModule from "../historyStore";

vi.mock("../historyStore", () => ({
  historyStore: {
    subscribe: vi.fn((run) => { run([]); return () => {}; }),
    add: vi.fn(),
    persist: vi.fn(),
    load: vi.fn(),
    clear: vi.fn(),
  },
}));
```

Add the describe block:
```ts
describe("history", () => {
  it("shows history button", () => {
    render(ExecutionPanel, { props: defaultProps });
    expect(screen.getByRole("button", { name: /history/i })).toBeInTheDocument();
  });

  it("opens history panel on history button click", async () => {
    render(ExecutionPanel, { props: defaultProps });

    await fireEvent.click(screen.getByRole("button", { name: /history/i }));

    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("opens history panel with Ctrl+H", async () => {
    render(ExecutionPanel, { props: defaultProps });

    await fireEvent.keyDown(window, { key: "h", ctrlKey: true });

    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("closes history panel on Escape", async () => {
    render(ExecutionPanel, { props: defaultProps });

    await fireEvent.click(screen.getByRole("button", { name: /history/i }));
    expect(screen.getByText("History")).toBeInTheDocument();

    await fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText("History")).not.toBeInTheDocument();
  });

  it("calls historyStore.add after successful execution", async () => {
    activeConnection.set(mockConnection);
    vi.mocked(api.executeQuery).mockResolvedValue('["result"]');

    render(ExecutionPanel, { props: defaultProps });

    await fireEvent.click(screen.getByRole("button", { name: /execute/i }));

    await waitFor(() => {
      expect(historyStoreModule.historyStore.add).toHaveBeenCalledWith("g.V().limit(10)");
    });
  });
});
```

**Step 2: Run tests to verify new tests fail**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/ExecutionPanel.test.ts
```

Expected: New history tests FAIL

**Step 3: Update `src/query/ExecutionPanel.svelte`**

Full updated file:

```svelte
<!--
  ExecutionPanel - Top-level component for query execution UI

  Component Hierarchy:
  ────────────────────
  ExecutionPanel
  ├── QueryHeader (buttons: Execute, New Tab, History, Disconnect)
  └── .tab-area (position: relative, fills remaining height)
      ├── TabContainer (tab management)
      │   ├── TabBar (tab headers, visible when 2+ tabs)
      │   └── QueryTab (textarea + results)
      │       └── ResultsPane (results display)
      └── HistoryPanel (absolutely positioned overlay, shown when showHistory=true)

  queryStore Access:
  ──────────────────
  ExecutionPanel (this component)
    - reads:  activeTabId, activeQuery, tabResults[].isExecuting
    - writes: setExecuting(), setResult()

  TabContainer
    - writes: setActiveTab(), updateActiveQuery(), clearTab(), reset()

  QueryTab
    - reads:  tabResults[tabId] (results, resultCount, isExecuting)
-->
<script lang="ts">
  import { fly } from "svelte/transition";
  import QueryHeader from "./QueryHeader.svelte";
  import TabContainer, { type TabContainerState } from "./TabContainer.svelte";
  import HistoryPanel from "./HistoryPanel.svelte";
  import { isConnected } from "../lib/stores";
  import { executeQuery } from "../lib/api";
  import { queryStore } from "./queryStore";
  import { historyStore } from "./historyStore";

  interface Props {
    onDisconnect: () => void;
  }

  let { onDisconnect }: Props = $props();

  let tabContainer: TabContainer;
  let containerState = $state<TabContainerState>({ canAddTab: true });
  let showHistory = $state(false);

  function handleStateChange(state: TabContainerState) {
    containerState = state;
  }

  let isExecuting = $derived(
    $queryStore.activeTabId
      ? ($queryStore.tabResults.get($queryStore.activeTabId)?.isExecuting ?? false)
      : false
  );

  function handleExecute() {
    if (!$isConnected) return;
    if (!$queryStore.activeTabId || !$queryStore.activeQuery.trim()) return;

    const tabId = $queryStore.activeTabId;
    const query = $queryStore.activeQuery.trim();

    queryStore.setExecuting(tabId);

    executeQuery(query)
      .then((result) => {
        let resultCount = "";
        try {
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            resultCount = `${parsed.length} result(s)`;
          }
        } catch {
          // non-JSON result, no count
        }
        queryStore.setResult(tabId, result, resultCount);
        historyStore.add(query);
      })
      .catch((e) => {
        queryStore.setResult(tabId, `Error: ${e}`, "");
      });
  }

  function handleAddTab() {
    tabContainer.addTab();
  }

  function handleDisconnect() {
    tabContainer.reset();
    onDisconnect();
  }

  function handleOpenFile() {
    tabContainer.openFile();
  }

  function handleSaveFile() {
    tabContainer.saveFile();
  }

  function handleToggleHistory() {
    showHistory = !showHistory;
  }

  function handleLoadHistoryEntry(query: string) {
    tabContainer.setActiveQuery(query);
    showHistory = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleExecute();
      } else if (e.key === "h") {
        e.preventDefault();
        handleToggleHistory();
      } else if (e.key === "t") {
        e.preventDefault();
        handleAddTab();
      } else if (e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      } else if (e.key === "o") {
        e.preventDefault();
        handleOpenFile();
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          tabContainer.prevTab();
        } else {
          tabContainer.nextTab();
        }
      }
    } else if (e.key === "Escape" && showHistory) {
      showHistory = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="execution-panel u-flex-column">
  <QueryHeader
    disabled={!$isConnected}
    {isExecuting}
    canAddTab={containerState.canAddTab}
    onExecute={handleExecute}
    onAddTab={handleAddTab}
    onDisconnect={handleDisconnect}
    onOpenFile={handleOpenFile}
    onSaveFile={handleSaveFile}
    onToggleHistory={handleToggleHistory}
  />
  <div class="tab-area">
    <TabContainer bind:this={tabContainer} onStateChange={handleStateChange} />
    {#if showHistory}
      <div class="history-overlay" transition:fly={{ x: 320, duration: 200 }}>
        <HistoryPanel
          entries={$historyStore}
          onClose={() => (showHistory = false)}
          onSelectEntry={handleLoadHistoryEntry}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .execution-panel {
    height: 100%;
    overflow: hidden;
  }

  .tab-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .history-overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    z-index: 10;
  }
</style>
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test -- src/query/__tests__/ExecutionPanel.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/query/ExecutionPanel.svelte src/query/__tests__/ExecutionPanel.test.ts
git commit -m "feat: wire history panel into ExecutionPanel"
```

---

### Task 6: Load history on app start, persist on app close

**Files:**
- Modify: `src/App.svelte`

**Step 1: Update `src/App.svelte`**

Add `onMount` and `historyStore` wiring:

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import ConnectionsPanel from "./connections/ConnectionsPanel.svelte";
  import ExecutionPanel from "./query/ExecutionPanel.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";
  import { activeConnection, isConnected } from "./lib/stores";
  import { connect, disconnect } from "./lib/api";
  import { toast } from "./lib/toastStore";
  import { historyStore } from "./query/historyStore";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import type { ConnectionConfig } from "./lib/types";

  onMount(async () => {
    await historyStore.load();
    window.addEventListener("beforeunload", () => {
      historyStore.persist();
    });
  });

  async function handleConnect(config: ConnectionConfig) {
    try {
      await connect(config);
      activeConnection.set(config);
    } catch (e) {
      toast(`Connection error: ${e}`, "error");
      activeConnection.set(null);
      return;
    }
    await getCurrentWindow().setTitle(`Peltzer - connected to «${config.name}»`);
  }

  async function handleDisconnect() {
    try {
      await disconnect();
      activeConnection.set(null);
    } catch (e) {
      toast(`Disconnect error: ${e}`, "error");
      return;
    }
    await historyStore.persist();
    await getCurrentWindow().setTitle("Peltzer");
  }
</script>

<ToastContainer />

{#if $isConnected}
  <ExecutionPanel onDisconnect={handleDisconnect} />
{:else}
  <ConnectionsPanel onconnect={handleConnect} />
{/if}
```

**Step 2: Run all tests**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "feat: load history on start and persist on disconnect/close"
```

---

### Task 7: Seed history in mock-tauri for visual dev testing

**Files:**
- Modify: `src/lib/mock-tauri.ts`

**Step 1: Add seed history to the mock Store**

In `src/lib/mock-tauri.ts`, update the `Store.load` method to seed `"history.json"` with sample entries:

Find the block:
```ts
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
```

Replace with:
```ts
static async load(name: string): Promise<Store> {
  if (!storeData.has(name)) {
    const m = new Map<string, unknown>();
    if (name === "connections.json") {
      m.set("connections", [seedConnection]);
    } else if (name === "history.json") {
      m.set("history", [
        { query: "g.V().has('name', 'marko').out('knows').values('name')" },
        { query: "g.E().hasLabel('knows').count()" },
        { query: "g.V().limit(10).valueMap()" },
        { query: "g.V().count()" },
      ]);
    }
    storeData.set(name, m);
  }
  return new Store(storeData.get(name)!);
}
```

**Step 2: Run all tests**

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/lib/mock-tauri.ts
git commit -m "chore: seed history entries in mock-tauri for dev mode"
```

---

### Task 8: Verify with `/verify`

Run the full build and test suite to confirm everything compiles and passes:

```bash
cd /Users/fquednau/Documents/repos/peltzer && npm test && npm run build
```

Expected: All tests PASS, build succeeds with no TypeScript errors.

Invoke the `/verify` skill to run the full build and test pipeline.
