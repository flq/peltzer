import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ConnectionForm from "../ConnectionForm.svelte";
import { mockBiometryStatus } from "../../test/setup";

describe("ConnectionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("secure storage checkbox", () => {
    it("enables checkbox when biometry is available", async () => {
      mockBiometryStatus.mockResolvedValue({ isAvailable: true, biometryType: 1 });

      render(ConnectionForm, { props: { onSave: vi.fn() } });

      // Select Standard connection type
      const standardButton = screen.getByRole("button", { name: "Standard" });
      await fireEvent.click(standardButton);

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/secure storage/i);
        expect(checkbox).not.toBeDisabled();
      });
    });

    it("disables checkbox when biometry is not available", async () => {
      mockBiometryStatus.mockResolvedValue({ isAvailable: false, biometryType: 0 });

      render(ConnectionForm, { props: { onSave: vi.fn() } });

      // Select Standard connection type
      const standardButton = screen.getByRole("button", { name: "Standard" });
      await fireEvent.click(standardButton);

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/secure storage/i);
        expect(checkbox).toBeDisabled();
      });
    });

    it("includes secure_storage in emitted config when checked", async () => {
      mockBiometryStatus.mockResolvedValue({ isAvailable: true, biometryType: 1 });
      const onSave = vi.fn();

      render(ConnectionForm, { props: { onSave } });

      // Select Standard connection type
      const standardButton = screen.getByRole("button", { name: "Standard" });
      await fireEvent.click(standardButton);

      // Wait for biometry check to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/secure storage/i)).not.toBeDisabled();
      });

      // Fill required fields
      await fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Test" } });
      await fireEvent.input(screen.getByLabelText("Host"), { target: { value: "localhost" } });

      // Check the secure storage checkbox
      const checkbox = screen.getByLabelText(/secure storage/i);
      await fireEvent.click(checkbox);

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      await fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          secure_storage: true,
        })
      );
    });

    it("shows secure storage checkbox for Cosmos connections", async () => {
      mockBiometryStatus.mockResolvedValue({ isAvailable: true, biometryType: 1 });

      render(ConnectionForm, { props: { onSave: vi.fn() } });

      // Select Cosmos DB connection type
      const cosmosButton = screen.getByRole("button", { name: "Cosmos DB" });
      await fireEvent.click(cosmosButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/secure storage/i)).toBeInTheDocument();
      });
    });
  });
});
