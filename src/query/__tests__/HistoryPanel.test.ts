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

  it("renders full query text (visual truncation handled by CSS)", () => {
    const longQuery = "g.V().has('name', 'marko').out('knows').out('knows').values('name').dedup().fold()_extra";
    render(HistoryPanel, { props: { ...defaultProps, entries: [{ query: longQuery }] } });
    expect(screen.getByText(longQuery)).toBeInTheDocument();
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

  it("renders History heading", () => {
    render(HistoryPanel, { props: defaultProps });
    expect(screen.getByText("History")).toBeInTheDocument();
  });
});
