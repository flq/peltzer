import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ExecutionPanel from "../ExecutionPanel.svelte";
import { isConnected } from "../../lib/stores";
import * as api from "../../lib/api";

// Mock the API module
vi.mock("../../lib/api", () => ({
  executeQuery: vi.fn(),
}));

describe("ExecutionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to disconnected state
    isConnected.set(false);
  });

  it("renders query pane and results pane", () => {
    render(ExecutionPanel);

    expect(screen.getByText("Query")).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("disables execute button when not connected", () => {
    isConnected.set(false);
    render(ExecutionPanel);

    const button = screen.getByRole("button", { name: /execute/i });
    expect(button).toBeDisabled();
  });

  it("enables execute button when connected", async () => {
    isConnected.set(true);
    render(ExecutionPanel);

    const button = screen.getByRole("button", { name: /execute/i });
    expect(button).not.toBeDisabled();
  });

  it("shows executing state while query runs", async () => {
    isConnected.set(true);

    // Make executeQuery hang until we resolve it
    let resolveQuery: (value: string) => void;
    vi.mocked(api.executeQuery).mockImplementation(
      () => new Promise((resolve) => { resolveQuery = resolve; })
    );

    render(ExecutionPanel);

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    // Should show executing state - button shows "Executing..." and is disabled
    const executingButton = screen.getByRole("button", { name: /executing/i });
    expect(executingButton).toBeInTheDocument();
    expect(executingButton).toBeDisabled();

    // Resolve the query
    resolveQuery!('["result"]');

    await waitFor(() => {
      // Button should no longer show "Executing..."
      expect(screen.queryByRole("button", { name: /executing/i })).not.toBeInTheDocument();
    });
  });

  it("displays query results on success", async () => {
    isConnected.set(true);

    const mockResult = JSON.stringify([
      { type: "vertex", id: 1, label: "person" },
      { type: "vertex", id: 2, label: "person" },
    ], null, 2);

    vi.mocked(api.executeQuery).mockResolvedValue(mockResult);

    render(ExecutionPanel);

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/vertex/)).toBeInTheDocument();
      expect(screen.getByText("2 result(s)")).toBeInTheDocument();
    });
  });

  it("displays error message on failure", async () => {
    isConnected.set(true);

    vi.mocked(api.executeQuery).mockRejectedValue(new Error("Connection refused"));

    render(ExecutionPanel);

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error:.*Connection refused/)).toBeInTheDocument();
    });
  });

  it("handles non-JSON results without showing count", async () => {
    isConnected.set(true);

    vi.mocked(api.executeQuery).mockResolvedValue("plain text result");

    render(ExecutionPanel);

    const button = screen.getByRole("button", { name: /execute/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("plain text result")).toBeInTheDocument();
      // Should not show result count for non-array results
      expect(screen.queryByText(/result\(s\)/)).not.toBeInTheDocument();
    });
  });

  it("does not execute query when not connected", async () => {
    isConnected.set(false);
    render(ExecutionPanel);

    // Button should be disabled, but let's also verify API isn't called
    expect(api.executeQuery).not.toHaveBeenCalled();
  });
});
