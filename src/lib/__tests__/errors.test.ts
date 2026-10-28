import { describe, it, expect } from "vitest";
import { errorMessage } from "../errors";

describe("errorMessage", () => {
  it("uses the message of an Error", () => {
    expect(errorMessage(new Error("Connection refused"))).toBe("Connection refused");
  });

  it("passes through a rejected string from a Tauri command", () => {
    expect(errorMessage("Invalid PIN")).toBe("Invalid PIN");
  });

  it("stringifies anything else", () => {
    expect(errorMessage(42)).toBe("42");
  });
});
