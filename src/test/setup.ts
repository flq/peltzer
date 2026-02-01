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
vi.mock("@tauri-apps/plugin-store", () => ({
  Store: {
    load: vi.fn().mockResolvedValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
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

// Mock @choochmeque/tauri-plugin-biometry-api
export const mockBiometryStatus = vi.fn().mockResolvedValue({ isAvailable: true, biometryType: 1 });
export const mockSetData = vi.fn().mockResolvedValue(undefined);
export const mockGetData = vi.fn().mockResolvedValue({ data: "{}" });
export const mockHasData = vi.fn().mockResolvedValue(false);
export const mockRemoveData = vi.fn().mockResolvedValue(undefined);

vi.mock("@choochmeque/tauri-plugin-biometry-api", () => ({
  checkStatus: mockBiometryStatus,
  setData: mockSetData,
  getData: mockGetData,
  hasData: mockHasData,
  removeData: mockRemoveData,
}));
