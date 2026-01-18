import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ExecutionPanel from "../ExecutionPanel.svelte";
import { activeConnection } from "../../lib/stores";
import { queryStore } from "../queryStore";
import * as api from "../../lib/api";

// Mock the API module
vi.mock("../../lib/api", () => ({
  executeQuery: vi.fn(),
}));

const defaultProps = {
  onDisconnect: vi.fn(),
};

const mockConnection = { type: "standard" as const, name: "Test", host: "localhost", port: 8182, use_ssl: false };

describe("ExecutionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeConnection.set(null);
    queryStore.reset();
  });

  it("renders query pane and results pane", () => {
    render(ExecutionPanel, { props: defaultProps });

    expect(screen.getByText("Query")).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("disables execute button when not connected", () => {
    activeConnection.set(null);
    render(ExecutionPanel, { props: defaultProps });

    const button = screen.getByRole("button", { name: /execute/i });
    expect(button).toBeDisabled();
  });

  it("enables execute button when connected", async () => {
    activeConnection.set(mockConnection);
    render(ExecutionPanel, { props: defaultProps });

    const button = screen.getByRole("button", { name: /execute/i });
    expect(button).not.toBeDisabled();
  });

  it("shows executing state while query runs", async () => {
    activeConnection.set(mockConnection);

    let resolveQuery: (value: string) => void;
    vi.mocked(api.executeQuery).mockImplementation(
      () => new Promise((resolve) => { resolveQuery = resolve; })
    );

    render(ExecutionPanel, { props: defaultProps });

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    // Button should be disabled and show spinner while executing
    expect(button).toBeDisabled();
    expect(document.querySelector(".spinner")).toBeInTheDocument();

    resolveQuery!('["result"]');

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(document.querySelector(".spinner")).not.toBeInTheDocument();
    });
  });

  it("displays query results on success", async () => {
    activeConnection.set(mockConnection);

    const mockResult = JSON.stringify([
      { type: "vertex", id: 1, label: "person" },
      { type: "vertex", id: 2, label: "person" },
    ], null, 2);

    vi.mocked(api.executeQuery).mockResolvedValue(mockResult);

    render(ExecutionPanel, { props: defaultProps });

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/vertex/)).toBeInTheDocument();
      expect(screen.getByText("2 result(s)")).toBeInTheDocument();
    });
  });

  it("displays error message on failure", async () => {
    activeConnection.set(mockConnection);

    vi.mocked(api.executeQuery).mockRejectedValue(new Error("Connection refused"));

    render(ExecutionPanel, { props: defaultProps });

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error:.*Connection refused/)).toBeInTheDocument();
    });
  });

  it("handles non-JSON results without showing count", async () => {
    activeConnection.set(mockConnection);

    vi.mocked(api.executeQuery).mockResolvedValue("plain text result");

    render(ExecutionPanel, { props: defaultProps });

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("plain text result")).toBeInTheDocument();
      expect(screen.queryByText(/result\(s\)/)).not.toBeInTheDocument();
    });
  });

  it("does not execute query when not connected", async () => {
    activeConnection.set(null);
    render(ExecutionPanel, { props: defaultProps });

    expect(api.executeQuery).not.toHaveBeenCalled();
  });

  it("calls onDisconnect when clicking disconnect button", async () => {
    activeConnection.set(mockConnection);
    const onDisconnect = vi.fn();
    render(ExecutionPanel, { props: { onDisconnect } });

    const disconnectButton = screen.getByRole("button", { name: /disconnect/i });
    await fireEvent.click(disconnectButton);

    expect(onDisconnect).toHaveBeenCalled();
  });

  it("executes query with Ctrl+Enter", async () => {
    activeConnection.set(mockConnection);
    vi.mocked(api.executeQuery).mockResolvedValue("[]");

    render(ExecutionPanel, { props: defaultProps });

    const textarea = screen.getByRole("textbox");
    await fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

    await waitFor(() => {
      expect(api.executeQuery).toHaveBeenCalled();
    });
  });

  // Tab functionality tests
  describe("tabs", () => {
    it("shows New Tab button", () => {
      render(ExecutionPanel, { props: defaultProps });

      expect(screen.getByRole("button", { name: /new tab/i })).toBeInTheDocument();
    });

    it("does not show tab bar with only one tab", () => {
      render(ExecutionPanel, { props: defaultProps });

      expect(screen.queryByText("Query 1")).not.toBeInTheDocument();
    });

    it("shows tab bar after adding a second tab", async () => {
      render(ExecutionPanel, { props: defaultProps });

      const newTabButton = screen.getByRole("button", { name: /new tab/i });
      await fireEvent.click(newTabButton);

      expect(screen.getByText("Query 1")).toBeInTheDocument();
      expect(screen.getByText("Query 2")).toBeInTheDocument();
    });

    it("switches between tabs and preserves query text", async () => {
      activeConnection.set(mockConnection);
      render(ExecutionPanel, { props: defaultProps });

      // Type in first tab
      const textarea = screen.getByRole("textbox");
      await fireEvent.input(textarea, { target: { value: "g.V().count()" } });

      // Add second tab
      const newTabButton = screen.getByRole("button", { name: /new tab/i });
      await fireEvent.click(newTabButton);

      // Second tab should have default query
      expect(screen.getByRole("textbox")).toHaveValue("g.V().limit(10)");

      // Switch back to first tab
      await fireEvent.click(screen.getByText("Query 1"));

      // First tab should have our custom query
      expect(screen.getByRole("textbox")).toHaveValue("g.V().count()");
    });

    it("preserves results per tab", async () => {
      activeConnection.set(mockConnection);
      vi.mocked(api.executeQuery).mockResolvedValue('["first tab result"]');

      render(ExecutionPanel, { props: defaultProps });

      // Execute in first tab
      const executeButton = screen.getByRole("button", { name: /execute/i });
      await fireEvent.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText(/first tab result/)).toBeInTheDocument();
      });

      // Add second tab (switches to it)
      const newTabButton = screen.getByRole("button", { name: /new tab/i });
      await fireEvent.click(newTabButton);

      // Second tab should not show first tab's results
      expect(screen.queryByText(/first tab result/)).not.toBeInTheDocument();

      // Switch back to first tab
      await fireEvent.click(screen.getByText("Query 1"));

      // First tab should still have its results
      expect(screen.getByText(/first tab result/)).toBeInTheDocument();
    });

    it("closes a tab when clicking close button", async () => {
      render(ExecutionPanel, { props: defaultProps });

      // Add second tab
      const newTabButton = screen.getByRole("button", { name: /new tab/i });
      await fireEvent.click(newTabButton);

      expect(screen.getByText("Query 1")).toBeInTheDocument();
      expect(screen.getByText("Query 2")).toBeInTheDocument();

      // Close second tab (close button)
      const closeButtons = document.querySelectorAll(".tab-close");
      await fireEvent.click(closeButtons[1]); // Close Query 2

      // Tab bar should be hidden (only one tab left)
      expect(screen.queryByText("Query 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Query 2")).not.toBeInTheDocument();
    });

    it("hides New Tab button when max tabs (5) reached", async () => {
      render(ExecutionPanel, { props: defaultProps });

      const newTabButton = screen.getByRole("button", { name: /new tab/i });

      // Add 4 more tabs (5 total)
      for (let i = 0; i < 4; i++) {
        await fireEvent.click(newTabButton);
      }

      // Should have 5 tabs
      expect(screen.getByText("Query 1")).toBeInTheDocument();
      expect(screen.getByText("Query 5")).toBeInTheDocument();

      // New Tab button should be hidden
      expect(screen.queryByRole("button", { name: /new tab/i })).not.toBeInTheDocument();
    });

    it("resets tabs on disconnect", async () => {
      render(ExecutionPanel, { props: defaultProps });

      // Add a second tab
      const newTabButton = screen.getByRole("button", { name: /new tab/i });
      await fireEvent.click(newTabButton);

      expect(screen.getByText("Query 2")).toBeInTheDocument();

      // Disconnect
      const disconnectButton = screen.getByRole("button", { name: /disconnect/i });
      await fireEvent.click(disconnectButton);

      // Tab bar should be gone (reset to single tab)
      expect(screen.queryByText("Query 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Query 2")).not.toBeInTheDocument();
    });

    it("adds new tab with Ctrl+T", async () => {
      render(ExecutionPanel, { props: defaultProps });

      // No tab bar initially
      expect(screen.queryByText("Query 1")).not.toBeInTheDocument();

      // Press Ctrl+T
      await fireEvent.keyDown(window, { key: "t", ctrlKey: true });

      // Tab bar should appear with 2 tabs
      expect(screen.getByText("Query 1")).toBeInTheDocument();
      expect(screen.getByText("Query 2")).toBeInTheDocument();
    });

    it("switches to next tab with Ctrl+Tab", async () => {
      activeConnection.set(mockConnection);
      render(ExecutionPanel, { props: defaultProps });

      // Type in first tab
      const textarea = screen.getByRole("textbox");
      await fireEvent.input(textarea, { target: { value: "first query" } });

      // Add second tab
      await fireEvent.keyDown(window, { key: "t", ctrlKey: true });

      // Should be on second tab with default query
      expect(screen.getByRole("textbox")).toHaveValue("g.V().limit(10)");

      // Press Ctrl+Tab to cycle back to first tab
      await fireEvent.keyDown(window, { key: "Tab", ctrlKey: true });

      // Should be back on first tab
      expect(screen.getByRole("textbox")).toHaveValue("first query");

      // Press Ctrl+Tab again to go to second tab
      await fireEvent.keyDown(window, { key: "Tab", ctrlKey: true });

      expect(screen.getByRole("textbox")).toHaveValue("g.V().limit(10)");
    });

    it("switches to previous tab with Ctrl+Shift+Tab", async () => {
      activeConnection.set(mockConnection);
      render(ExecutionPanel, { props: defaultProps });

      // Type in first tab
      const textarea = screen.getByRole("textbox");
      await fireEvent.input(textarea, { target: { value: "first query" } });

      // Add second tab (now on tab 2)
      await fireEvent.keyDown(window, { key: "t", ctrlKey: true });

      // Add third tab (now on tab 3)
      await fireEvent.keyDown(window, { key: "t", ctrlKey: true });
      await fireEvent.input(screen.getByRole("textbox"), { target: { value: "third query" } });

      // Press Ctrl+Shift+Tab to go to previous tab (tab 2)
      await fireEvent.keyDown(window, { key: "Tab", ctrlKey: true, shiftKey: true });
      expect(screen.getByRole("textbox")).toHaveValue("g.V().limit(10)");

      // Press Ctrl+Shift+Tab again to go to tab 1
      await fireEvent.keyDown(window, { key: "Tab", ctrlKey: true, shiftKey: true });
      expect(screen.getByRole("textbox")).toHaveValue("first query");

      // Press Ctrl+Shift+Tab again to wrap to tab 3
      await fireEvent.keyDown(window, { key: "Tab", ctrlKey: true, shiftKey: true });
      expect(screen.getByRole("textbox")).toHaveValue("third query");
    });
  });
});
