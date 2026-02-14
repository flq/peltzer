import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ConnectionsPanel from "../ConnectionsPanel.svelte";
import { savedConnections } from "../../lib/stores";
import type { StandardConnectionConfig, CosmosConnectionConfig } from "../../lib/types";
import * as api from "../../lib/api";

vi.mock("../../lib/api", () => ({
  getSavedConnections: vi.fn(),
  saveConnection: vi.fn(),
  deleteConnection: vi.fn(),
  getConnectionWithCredentials: vi.fn(),
}));

const mockStandardConnection: StandardConnectionConfig = {
  type: "standard",
  name: "Test DB",
  host: "localhost",
  port: 8182,
  use_ssl: false,
  secure_storage: false,
};

const mockSecureConnection: StandardConnectionConfig = {
  type: "standard",
  name: "Secure DB",
  host: "localhost",
  port: 8182,
  use_ssl: false,
  secure_storage: true,
};

const mockCosmosConnection: CosmosConnectionConfig = {
  type: "cosmos",
  name: "My Cosmos",
  endpoint: "myaccount.gremlin.cosmos.azure.com",
  database: "graphdb",
  container: "mygraph",
  key: "secret-key",
  secure_storage: false,
};

describe("ConnectionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedConnections.set([]);
    vi.mocked(api.getSavedConnections).mockResolvedValue([]);
    vi.mocked(api.getConnectionWithCredentials).mockImplementation(async (config) => config);
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
    savedConnections.set([mockStandardConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.getByText(mockStandardConnection.name)).toBeInTheDocument();
    expect(screen.getByText(`${mockStandardConnection.host}:${mockStandardConnection.port}`)).toBeInTheDocument();
  });

  it("calls onconnect directly for non-secure connections", async () => {
    savedConnections.set([mockStandardConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const connectionButton = screen.getByRole("button", { name: new RegExp(mockStandardConnection.name, "i") });
    await fireEvent.click(connectionButton);

    expect(onconnect).toHaveBeenCalledWith(mockStandardConnection);
  });

  it("opens modal when clicking add new connection", async () => {
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const addButton = screen.getByRole("button", { name: /new connection/i });
    await fireEvent.click(addButton);

    expect(screen.getByRole("heading", { name: "New Connection" })).toBeInTheDocument();
    expect(screen.getByText("Select connection type:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cosmos DB" })).toBeInTheDocument();
  });

  it("can add a new Standard connection via modal", async () => {
    const onconnect = vi.fn();
    vi.mocked(api.saveConnection).mockResolvedValue(undefined);
    vi.mocked(api.getSavedConnections).mockResolvedValue([mockStandardConnection]);

    render(ConnectionsPanel, { props: { onconnect } });

    // Open modal
    const addButton = screen.getByRole("button", { name: /new connection/i });
    await fireEvent.click(addButton);

    // Select Standard connection type
    const standardButton = screen.getByRole("button", { name: "Standard" });
    await fireEvent.click(standardButton);

    // Fill form using mock values
    await fireEvent.input(screen.getByLabelText("Name"), { target: { value: mockStandardConnection.name } });
    await fireEvent.input(screen.getByLabelText("Host"), { target: { value: mockStandardConnection.host } });
    await fireEvent.input(screen.getByLabelText("Port"), { target: { value: String(mockStandardConnection.port) } });

    // Save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.saveConnection).toHaveBeenCalledWith({
        ...mockStandardConnection,
        username: "",
        password: "",
      });
    });
  });

  it("can add a new Cosmos connection via modal", async () => {
    const onconnect = vi.fn();
    vi.mocked(api.saveConnection).mockResolvedValue(undefined);
    vi.mocked(api.getSavedConnections).mockResolvedValue([mockCosmosConnection]);

    render(ConnectionsPanel, { props: { onconnect } });

    // Open modal
    const addButton = screen.getByRole("button", { name: /new connection/i });
    await fireEvent.click(addButton);

    // Select Cosmos DB connection type
    const cosmosButton = screen.getByRole("button", { name: "Cosmos DB" });
    await fireEvent.click(cosmosButton);

    // Fill form using mock values
    await fireEvent.input(screen.getByLabelText("Name"), { target: { value: mockCosmosConnection.name } });
    await fireEvent.input(screen.getByLabelText("Endpoint"), { target: { value: mockCosmosConnection.endpoint } });
    await fireEvent.input(screen.getByLabelText("Database"), { target: { value: mockCosmosConnection.database } });
    await fireEvent.input(screen.getByLabelText("Container"), { target: { value: mockCosmosConnection.container } });
    await fireEvent.input(screen.getByLabelText("Key"), { target: { value: mockCosmosConnection.key } });

    // Save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.saveConnection).toHaveBeenCalledWith(mockCosmosConnection);
    });
  });

  it("deletes a connection when clicking delete", async () => {
    savedConnections.set([mockStandardConnection]);
    vi.mocked(api.deleteConnection).mockResolvedValue(undefined);
    vi.mocked(api.getSavedConnections).mockResolvedValue([]);

    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.deleteConnection).toHaveBeenCalledWith(mockStandardConnection.name);
    });

    await waitFor(() => {
      expect(screen.getByText("No saved connections")).toBeInTheDocument();
    });
  });

  it("opens Standard form when editing a Standard connection", async () => {
    savedConnections.set([mockStandardConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const editButton = screen.getByRole("button", { name: /edit/i });
    await fireEvent.click(editButton);

    expect(screen.getByText("Edit Connection")).toBeInTheDocument();
    expect(screen.queryByText("Select connection type:")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Host")).toBeInTheDocument();
    expect(screen.getByLabelText("Port")).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockStandardConnection.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockStandardConnection.host)).toBeInTheDocument();
  });

  it("opens Cosmos form when editing a Cosmos connection", async () => {
    savedConnections.set([mockCosmosConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const editButton = screen.getByRole("button", { name: /edit/i });
    await fireEvent.click(editButton);

    expect(screen.getByText("Edit Connection")).toBeInTheDocument();
    expect(screen.queryByText("Select connection type:")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Endpoint")).toBeInTheDocument();
    expect(screen.getByLabelText("Database")).toBeInTheDocument();
    expect(screen.getByLabelText("Container")).toBeInTheDocument();
    expect(screen.getByLabelText("Key")).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockCosmosConnection.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockCosmosConnection.endpoint)).toBeInTheDocument();
  });

  it("resets form state when closing and reopening modal", async () => {
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    // Open modal
    const addButton = screen.getByRole("button", { name: /new connection/i });
    await fireEvent.click(addButton);

    // Select Standard type
    const standardButton = screen.getByRole("button", { name: "Standard" });
    await fireEvent.click(standardButton);

    // Verify we're in the Standard form (no type selector)
    expect(screen.queryByText("Select connection type:")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Host")).toBeInTheDocument();

    // Close modal via close button
    const closeButton = screen.getByRole("button", { name: "×" });
    await fireEvent.click(closeButton);

    // Reopen modal
    await fireEvent.click(addButton);

    // Should show type selector again, not the Standard form
    expect(screen.getByText("Select connection type:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cosmos DB" })).toBeInTheDocument();
  });

  it("shows lock icon for secure connections", async () => {
    savedConnections.set([mockSecureConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.getByLabelText("Secure connection")).toBeInTheDocument();
  });

  it("does not show lock icon for non-secure connections", async () => {
    savedConnections.set([mockStandardConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.queryByLabelText("Secure connection")).not.toBeInTheDocument();
  });

  it("shows PIN modal when clicking a secure connection", async () => {
    savedConnections.set([mockSecureConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    const connectionButton = screen.getByRole("button", { name: new RegExp(mockSecureConnection.name, "i") });
    await fireEvent.click(connectionButton);

    // PIN modal should appear
    expect(screen.getByText(`Enter PIN for "${mockSecureConnection.name}"`)).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
  });

  it("connects with PIN after entering it in modal", async () => {
    savedConnections.set([mockSecureConnection]);
    const fullConfig = { ...mockSecureConnection, username: "user", password: "pass" };
    vi.mocked(api.getConnectionWithCredentials).mockResolvedValue(fullConfig);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    // Click secure connection
    const connectionButton = screen.getByRole("button", { name: new RegExp(mockSecureConnection.name, "i") });
    await fireEvent.click(connectionButton);

    // Enter PIN
    const pinInput = screen.getByLabelText("PIN");
    await fireEvent.input(pinInput, { target: { value: "1234" } });

    // Confirm
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    await fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.getConnectionWithCredentials).toHaveBeenCalledWith(mockSecureConnection, "1234");
    });
    expect(onconnect).toHaveBeenCalledWith(fullConfig);
  });
});
