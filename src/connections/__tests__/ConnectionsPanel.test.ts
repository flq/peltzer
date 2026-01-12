import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ConnectionsPanel from "../ConnectionsPanel.svelte";
import { savedConnections } from "../../lib/stores";
import * as api from "../../lib/api";

vi.mock("../../lib/api", () => ({
  getSavedConnections: vi.fn(),
  saveConnection: vi.fn(),
  deleteConnection: vi.fn(),
}));

const mockConnection = {
  name: "Test DB",
  host: "localhost",
  port: 8182,
  use_ssl: false,
};

describe("ConnectionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedConnections.set([]);
    vi.mocked(api.getSavedConnections).mockResolvedValue([]);
  });

  it("renders connections heading and add button", async () => {
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.getByText("Connections")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new connection/i })).toBeInTheDocument();
  });

  it("shows 'No saved connections' when list is empty", async () => {
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.getByText("No saved connections")).toBeInTheDocument();
  });

  it("displays saved connections from store", async () => {
    savedConnections.set([mockConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.getByText("Test DB")).toBeInTheDocument();
    expect(screen.getByText("localhost:8182")).toBeInTheDocument();
  });

  it("calls onconnect when clicking a connection name", async () => {
    savedConnections.set([mockConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const connectionButton = screen.getByRole("button", { name: /test db/i });
    await fireEvent.click(connectionButton);

    expect(onconnect).toHaveBeenCalledWith(mockConnection);
  });

  it("opens modal when clicking add new connection", async () => {
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const addButton = screen.getByRole("button", { name: /new connection/i });
    await fireEvent.click(addButton);

    expect(screen.getByText("New Connection")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("can add a new connection via modal", async () => {
    const onconnect = vi.fn();
    vi.mocked(api.saveConnection).mockResolvedValue(undefined);
    vi.mocked(api.getSavedConnections).mockResolvedValue([mockConnection]);

    render(ConnectionsPanel, { props: { onconnect } });

    // Open modal
    const addButton = screen.getByRole("button", { name: /new connection/i });
    await fireEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByLabelText("Name");
    const hostInput = screen.getByLabelText("Host");
    const portInput = screen.getByLabelText("Port");

    await fireEvent.input(nameInput, { target: { value: "Test DB" } });
    await fireEvent.input(hostInput, { target: { value: "localhost" } });
    await fireEvent.input(portInput, { target: { value: "8182" } });

    // Save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.saveConnection).toHaveBeenCalled();
    });
  });

  it("deletes a connection when clicking delete", async () => {
    savedConnections.set([mockConnection]);
    vi.mocked(api.deleteConnection).mockResolvedValue(undefined);
    vi.mocked(api.getSavedConnections).mockResolvedValue([]);

    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.deleteConnection).toHaveBeenCalledWith("Test DB");
    });

    await waitFor(() => {
      expect(screen.getByText("No saved connections")).toBeInTheDocument();
    });
  });

  it("opens modal with connection data when clicking edit", async () => {
    savedConnections.set([mockConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const editButton = screen.getByRole("button", { name: /edit/i });
    await fireEvent.click(editButton);

    expect(screen.getByText("Edit Connection")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test DB")).toBeInTheDocument();
    expect(screen.getByDisplayValue("localhost")).toBeInTheDocument();
  });
});
