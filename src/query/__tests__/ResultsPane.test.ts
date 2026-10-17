import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import ResultsPane from "../ResultsPane.svelte";

describe("ResultsPane copy button", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  it("is disabled when there are no results", () => {
    render(ResultsPane, { props: { results: "" } });

    expect(screen.getByTitle("Copy results")).toBeDisabled();
  });

  it("copies the results to the clipboard", async () => {
    const results = '[{"id": 1}]';
    render(ResultsPane, { props: { results, resultCount: "1 result(s)" } });

    await fireEvent.click(screen.getByTitle("Copy results"));

    expect(writeText).toHaveBeenCalledWith(results);
  });
});
