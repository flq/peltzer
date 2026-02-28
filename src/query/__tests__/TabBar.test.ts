import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import TabBar from "../TabBar.svelte";

describe("TabBar", () => {
  it("shows filename when tab has filePath", () => {
    const tabs = [
      { id: "1", queryText: "g.V()", filePath: "/home/user/my-query.gremlin" },
      { id: "2", queryText: "g.E()" },
    ];

    render(TabBar, {
      props: {
        tabs,
        activeTabId: "1",
        onSelectTab: vi.fn(),
        onCloseTab: vi.fn(),
      },
    });

    expect(screen.getByText("my-query.gremlin")).toBeInTheDocument();
    expect(screen.getByText("Query 2")).toBeInTheDocument();
  });

  it("shows generic name when tab has no filePath", () => {
    const tabs = [
      { id: "1", queryText: "g.V()" },
      { id: "2", queryText: "g.E()" },
    ];

    render(TabBar, {
      props: {
        tabs,
        activeTabId: "1",
        onSelectTab: vi.fn(),
        onCloseTab: vi.fn(),
      },
    });

    expect(screen.getByText("Query 1")).toBeInTheDocument();
    expect(screen.getByText("Query 2")).toBeInTheDocument();
  });

  it("handles Windows-style backslash paths", () => {
    const tabs = [
      { id: "1", queryText: "g.V()", filePath: "C:\\Users\\user\\query.gremlin" },
      { id: "2", queryText: "g.E()" },
    ];

    render(TabBar, {
      props: {
        tabs,
        activeTabId: "1",
        onSelectTab: vi.fn(),
        onCloseTab: vi.fn(),
      },
    });

    expect(screen.getByText("query.gremlin")).toBeInTheDocument();
  });
});
