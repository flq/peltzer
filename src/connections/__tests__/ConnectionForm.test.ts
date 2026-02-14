import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ConnectionForm from "../ConnectionForm.svelte";

describe("ConnectionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("secure storage checkbox", () => {
    it("shows secure storage checkbox that is always enabled", async () => {
      render(ConnectionForm, { props: { onSave: vi.fn() } });

      // Select Standard connection type
      const standardButton = screen.getByRole("button", { name: "Standard" });
      await fireEvent.click(standardButton);

      const checkbox = screen.getByLabelText(/secure storage/i);
      expect(checkbox).not.toBeDisabled();
    });

    it("includes secure_storage in emitted config when checked", async () => {
      const onSave = vi.fn();

      render(ConnectionForm, { props: { onSave } });

      // Select Standard connection type
      const standardButton = screen.getByRole("button", { name: "Standard" });
      await fireEvent.click(standardButton);

      // Fill required fields
      await fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Test" } });
      await fireEvent.input(screen.getByLabelText("Host"), { target: { value: "localhost" } });

      // Check the secure storage checkbox
      const checkbox = screen.getByLabelText(/secure storage/i);
      await fireEvent.click(checkbox);

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            secure_storage: true,
          })
        );
      });
    });

    it("shows secure storage checkbox for Cosmos connections", async () => {
      render(ConnectionForm, { props: { onSave: vi.fn() } });

      // Select Cosmos DB connection type
      const cosmosButton = screen.getByRole("button", { name: "Cosmos DB" });
      await fireEvent.click(cosmosButton);

      expect(screen.getByLabelText(/secure storage/i)).toBeInTheDocument();
    });
  });
});
