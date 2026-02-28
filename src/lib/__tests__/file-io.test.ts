import { describe, it, expect, vi, beforeEach } from "vitest";
import { openQueryFile, saveQueryToFile } from "../file-io";

// Mock the dialog plugin
const mockOpen = vi.fn();
const mockSave = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => mockOpen(...args),
  save: (...args: unknown[]) => mockSave(...args),
}));

// Mock the fs plugin
const mockReadTextFile = vi.fn();
const mockWriteTextFile = vi.fn();
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: (...args: unknown[]) => mockReadTextFile(...args),
  writeTextFile: (...args: unknown[]) => mockWriteTextFile(...args),
}));

describe("file-io", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openQueryFile", () => {
    it("returns file path and content when user selects a file", async () => {
      mockOpen.mockResolvedValue("/home/user/test.gremlin");
      mockReadTextFile.mockResolvedValue("g.V().count()");

      const result = await openQueryFile();

      expect(result).toEqual({
        filePath: "/home/user/test.gremlin",
        content: "g.V().count()",
      });
      expect(mockOpen).toHaveBeenCalledWith({
        filters: [{ name: "Gremlin", extensions: ["gremlin"] }],
      });
    });

    it("returns null when user cancels", async () => {
      mockOpen.mockResolvedValue(null);

      const result = await openQueryFile();

      expect(result).toBeNull();
      expect(mockReadTextFile).not.toHaveBeenCalled();
    });
  });

  describe("saveQueryToFile", () => {
    it("writes to existing filePath without showing dialog", async () => {
      mockWriteTextFile.mockResolvedValue(undefined);

      const result = await saveQueryToFile("g.V()", "/home/user/existing.gremlin");

      expect(result).toBe("/home/user/existing.gremlin");
      expect(mockSave).not.toHaveBeenCalled();
      expect(mockWriteTextFile).toHaveBeenCalledWith("/home/user/existing.gremlin", "g.V()");
    });

    it("shows save dialog when no filePath provided", async () => {
      mockSave.mockResolvedValue("/home/user/new-query.gremlin");
      mockWriteTextFile.mockResolvedValue(undefined);

      const result = await saveQueryToFile("g.V()");

      expect(result).toBe("/home/user/new-query.gremlin");
      expect(mockSave).toHaveBeenCalledWith({
        filters: [{ name: "Gremlin", extensions: ["gremlin"] }],
      });
      expect(mockWriteTextFile).toHaveBeenCalledWith("/home/user/new-query.gremlin", "g.V()");
    });

    it("returns null when user cancels save dialog", async () => {
      mockSave.mockResolvedValue(null);

      const result = await saveQueryToFile("g.V()");

      expect(result).toBeNull();
      expect(mockWriteTextFile).not.toHaveBeenCalled();
    });
  });
});
