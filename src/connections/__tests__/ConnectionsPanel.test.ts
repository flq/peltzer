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
}));

const mockStandardConnection: StandardConnectionConfig = {
  type: "standard",
  name: "Test DB",
  host: "localhost",
  port: 8182,
  use_ssl: false,
};

const mockCosmosConnection: CosmosConnectionConfig = {
  type: "cosmos",
  name: "My Cosmos",
  endpoint: "myaccount.gremlin.cosmos.azure.com",
  database: "graphdb",
  container: "mygraph",
  key: "secret-key",
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
    savedConnections.set([mockStandardConnection]);
    const onconnect = vi.fn();
    render(ConnectionsPanel, { props: { onconnect } });

    expect(screen.getByText(mockStandardConnection.name)).toBeInTheDocument();
    expect(screen.getByText(`${mockStandardConnection.host}:${mockStandardConnection.port}`)).toBeInTheDocument();
  });

  it("calls onconnect when clicking a connection name", async () => {
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

    expect(screen.getByText("New Connection")).toBeInTheDocument();
    // New connection shows type selector first
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
    // Should show Standard form fields, not type selector
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
    // Should show Cosmos form fields, not type selector
    expect(screen.queryByText("Select connection type:")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Endpoint")).toBeInTheDocument();
    expect(screen.getByLabelText("Database")).toBeInTheDocument();
    expect(screen.getByLabelText("Container")).toBeInTheDocument();
    expect(screen.getByLabelText("Key")).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockCosmosConnection.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockCosmosConnection.endpoint)).toBeInTheDocument();
  });
});
