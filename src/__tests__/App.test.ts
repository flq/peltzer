import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import App from "../App.svelte";
import { activeConnection } from "../lib/stores";
import { mockSetTitle } from "../test/setup";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSavedConnections: vi.fn().mockResolvedValue([]),
  saveConnection: vi.fn(),
  deleteConnection: vi.fn(),
}));

const mockConnection = {
  type: "standard" as const,
  name: "Test DB",
  host: "localhost",
  port: 8182,
  use_ssl: false,
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeConnection.set(null);
  });

  it("sets window title with connection name after successful connect", async () => {
    vi.mocked(api.connect).mockResolvedValue("connected");
    vi.mocked(api.getSavedConnections).mockResolvedValue([mockConnection]);

    render(App);

    // Wait for connections to load and click on the connection
    await waitFor(() => {
      expect(screen.getByText("Test DB")).toBeInTheDocument();
    });

    const connectionButton = screen.getByRole("button", { name: /test db/i });
    await fireEvent.click(connectionButton);

    await waitFor(() => {
      expect(mockSetTitle).toHaveBeenCalledWith("Peltzer - connected to «Test DB»");
    });
  });

  it("resets window title to 'Peltzer' after successful disconnect", async () => {
    vi.mocked(api.connect).mockResolvedValue("connected");
    vi.mocked(api.disconnect).mockResolvedValue(undefined);
    vi.mocked(api.getSavedConnections).mockResolvedValue([mockConnection]);

    render(App);

    // Connect first
    await waitFor(() => {
      expect(screen.getByText("Test DB")).toBeInTheDocument();
    });

    const connectionButton = screen.getByRole("button", { name: /test db/i });
    await fireEvent.click(connectionButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
    });

    // Clear mock to isolate disconnect test
    mockSetTitle.mockClear();

    // Disconnect
    const disconnectButton = screen.getByRole("button", { name: /disconnect/i });
    await fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(mockSetTitle).toHaveBeenCalledWith("Peltzer");
    });
  });

  it("does not set window title if connect fails", async () => {
    vi.mocked(api.connect).mockRejectedValue(new Error("Connection refused"));
    vi.mocked(api.getSavedConnections).mockResolvedValue([mockConnection]);

    render(App);

    await waitFor(() => {
      expect(screen.getByText("Test DB")).toBeInTheDocument();
    });

    const connectionButton = screen.getByRole("button", { name: /test db/i });
    await fireEvent.click(connectionButton);

    // Wait a bit for any async operations
    await waitFor(() => {
      expect(screen.getByText(/Connection error/)).toBeInTheDocument();
    });

    expect(mockSetTitle).not.toHaveBeenCalled();
  });
});
