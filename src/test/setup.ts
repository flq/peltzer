import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock HTMLDialogElement methods (not implemented in jsdom)
HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
});
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute("open");
});

// Mock @tauri-apps/api/core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock @tauri-apps/plugin-store
export const mockStoreGet = vi.fn().mockResolvedValue(null);
export const mockStoreSet = vi.fn().mockResolvedValue(undefined);
export const mockStoreSave = vi.fn().mockResolvedValue(undefined);
export const mockStoreDelete = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/plugin-store", () => ({
  Store: {
    load: vi.fn().mockResolvedValue({
      get: mockStoreGet,
      set: mockStoreSet,
      save: mockStoreSave,
      delete: mockStoreDelete,
    }),
  },
}));

// Mock @tauri-apps/api/window
export const mockSetTitle = vi.fn().mockResolvedValue(undefined);
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    setTitle: mockSetTitle,
  })),
}));

// Mock crypto.randomUUID (not implemented in jsdom, needed by TabContainer)
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      ...globalThis.crypto,
      randomUUID: () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
    },
    writable: true,
  });
}
