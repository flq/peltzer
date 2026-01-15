import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import TestConnectionButtonHarness from "./TestConnectionButtonHarness.svelte";
import * as api from "../../lib/api";
import { toasts } from "../../lib/toastStore";

vi.mock("../../lib/api", () => ({
  testConnection: vi.fn(),
}));

describe("TestConnectionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toasts.subscribe((t) => t.forEach((toast) => toasts.remove(toast.id)))();
  });

  it("renders test button", () => {
    render(TestConnectionButtonHarness);

    expect(screen.getByRole("button", { name: /test/i })).toBeInTheDocument();
  });

  it("shows spinner while testing", async () => {
    let resolveTest: (value: string) => void;
    vi.mocked(api.testConnection).mockImplementation(
      () => new Promise((resolve) => { resolveTest = resolve; })
    );

    render(TestConnectionButtonHarness);

    const button = screen.getByRole("button", { name: /test/i });
    await fireEvent.click(button);

    expect(document.querySelector(".spinner")).toBeInTheDocument();
    expect(button).toBeDisabled();

    resolveTest!("Connection successful");

    await waitFor(() => {
      expect(document.querySelector(".spinner")).not.toBeInTheDocument();
    });
  });

  it("shows success toast on successful connection", async () => {
    vi.mocked(api.testConnection).mockResolvedValue("Connection successful");

    render(TestConnectionButtonHarness);

    const button = screen.getByRole("button", { name: /test/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Connection successful")).toBeInTheDocument();
    });
  });

  it("shows error inline on failed connection", async () => {
    vi.mocked(api.testConnection).mockRejectedValue(new Error("Connection refused"));

    render(TestConnectionButtonHarness);

    const button = screen.getByRole("button", { name: /test/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Connection refused/)).toBeInTheDocument();
    });
  });

  it("passes config to testConnection API", async () => {
    vi.mocked(api.testConnection).mockResolvedValue("OK");

    render(TestConnectionButtonHarness);

    const button = screen.getByRole("button", { name: /test/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(api.testConnection).toHaveBeenCalledWith({
        type: "standard",
        name: "Test DB",
        host: "localhost",
        port: 8182,
        use_ssl: false,
      });
    });
  });
});
