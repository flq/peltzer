import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { toasts } from "../../lib/toastStore";
import ToastTestHarness from "./ToastTestHarness.svelte";

describe("ToastContainer", () => {
  beforeEach(() => {
    // Clear any existing toasts
    toasts.subscribe((t) => t.forEach((toast) => toasts.remove(toast.id)))();
  });

  it("displays a success toast when triggered", async () => {
    render(ToastTestHarness);

    const successButton = screen.getByRole("button", { name: /show success/i });
    await fireEvent.click(successButton);

    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("displays an error toast when triggered", async () => {
    render(ToastTestHarness);

    const errorButton = screen.getByRole("button", { name: /show error/i });
    await fireEvent.click(errorButton);

    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("removes toast when close button is clicked", async () => {
    render(ToastTestHarness);

    const successButton = screen.getByRole("button", { name: /show success/i });
    await fireEvent.click(successButton);

    expect(screen.getByText("Success message")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /×/ });
    await fireEvent.click(closeButton);

    expect(screen.queryByText("Success message")).not.toBeInTheDocument();
  });

  it("can display multiple toasts", async () => {
    render(ToastTestHarness);

    const successButton = screen.getByRole("button", { name: /show success/i });
    const errorButton = screen.getByRole("button", { name: /show error/i });

    await fireEvent.click(successButton);
    await fireEvent.click(errorButton);

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });
});
