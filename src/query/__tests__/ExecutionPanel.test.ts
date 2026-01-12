import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ExecutionPanel from "../ExecutionPanel.svelte";
import { activeConnection } from "../../lib/stores";
import * as api from "../../lib/api";

// Mock the API module
vi.mock("../../lib/api", () => ({
  executeQuery: vi.fn(),
}));

const defaultProps = {
  ondisconnect: vi.fn(),
};

const mockConnection = { name: "Test", host: "localhost", port: 8182, use_ssl: false };

describe("ExecutionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeConnection.set(null);
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

  it("calls ondisconnect when clicking disconnect button", async () => {
    activeConnection.set(mockConnection);
    const ondisconnect = vi.fn();
    render(ExecutionPanel, { props: { ondisconnect } });

    const disconnectButton = screen.getByRole("button", { name: /disconnect/i });
    await fireEvent.click(disconnectButton);

    expect(ondisconnect).toHaveBeenCalled();
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
});
