import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import QueryTab from "../QueryTab.svelte";
import { queryStore } from "../queryStore";

function setup(queryText: string) {
  const onQueryChange = vi.fn();
  render(QueryTab, { props: { tab: { id: "t1", queryText }, onQueryChange } });
  const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
  textarea.setSelectionRange(queryText.length, queryText.length);
  return { textarea, onQueryChange };
}

describe("QueryTab typing assist", () => {
  beforeEach(() => {
    queryStore.reset();
  });

  it("auto-closes ( and keeps the cursor inside", async () => {
    const { textarea, onQueryChange } = setup("g.V");

    await fireEvent.keyDown(textarea, { key: "(" });

    expect(textarea.value).toBe("g.V()");
    expect(textarea.selectionStart).toBe(4);
    expect(onQueryChange).toHaveBeenLastCalledWith("g.V()");
  });

  it("puts a dot typed right after ( behind the closing paren", async () => {
    const { textarea } = setup("g.V");

    await fireEvent.keyDown(textarea, { key: "(" });
    await fireEvent.keyDown(textarea, { key: "." });

    expect(textarea.value).toBe("g.V().");
    expect(textarea.selectionStart).toBe(6);
  });

  it("auto-closes a quote and keeps the cursor inside", async () => {
    const { textarea } = setup("g.V().has(");

    await fireEvent.keyDown(textarea, { key: '"' });

    expect(textarea.value).toBe('g.V().has(""');
    expect(textarea.selectionStart).toBe(11);
  });

  it("leaves Ctrl/Cmd shortcuts alone", async () => {
    const { textarea } = setup("g.V");

    await fireEvent.keyDown(textarea, { key: "(", metaKey: true });

    expect(textarea.value).toBe("g.V");
  });
});
