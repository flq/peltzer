import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import ButtonTestHarness from "./ButtonTestHarness.svelte";

describe("Button", () => {
  it("renders button with text", () => {
    render(ButtonTestHarness);

    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onclick handler when clicked", async () => {
    render(ButtonTestHarness);

    const button = screen.getByRole("button", { name: /click me/i });
    await fireEvent.click(button);

    expect(screen.getByText("Clicked: 1")).toBeInTheDocument();
  });

  it("is disabled when pending is true", () => {
    render(ButtonTestHarness, { props: { pending: true } });

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeDisabled();
  });

  it("is marked busy, keeping its name, when pending", () => {
    render(ButtonTestHarness, { props: { pending: true } });

    expect(screen.getByRole("button", { name: /click me/i, busy: true })).toBeInTheDocument();
  });

  it("is not marked busy when not pending", () => {
    render(ButtonTestHarness, { props: { pending: false } });

    expect(screen.getByRole("button", { name: /click me/i, busy: false })).toBeInTheDocument();
  });
});
