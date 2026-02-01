import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockBiometryStatus,
  mockSetData,
  mockGetData,
  mockHasData,
  mockRemoveData,
} from "../../test/setup";
import {
  isBiometryAvailable,
  storeCredentials,
  retrieveCredentials,
  hasCredentials,
  removeCredentials,
} from "../biometry";

describe("biometry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isBiometryAvailable", () => {
    it("returns true when biometry is available", async () => {
      mockBiometryStatus.mockResolvedValue({ isAvailable: true, biometryType: 1 });
      const result = await isBiometryAvailable();
      expect(result).toBe(true);
    });

    it("returns false when biometry is not available", async () => {
      mockBiometryStatus.mockResolvedValue({ isAvailable: false, biometryType: 0 });
      const result = await isBiometryAvailable();
      expect(result).toBe(false);
    });

    it("returns false when checkStatus throws", async () => {
      mockBiometryStatus.mockRejectedValue(new Error("Not supported"));
      const result = await isBiometryAvailable();
      expect(result).toBe(false);
    });
  });

  describe("storeCredentials", () => {
    it("calls setData with correct domain and name", async () => {
      const credentials = { username: "user", password: "pass" };
      await storeCredentials("MyConnection", credentials);

      expect(mockSetData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:MyConnection:credentials",
        data: JSON.stringify(credentials),
      });
    });
  });

  describe("retrieveCredentials", () => {
    it("calls getData and parses the result", async () => {
      const credentials = { username: "user", password: "pass" };
      mockGetData.mockResolvedValue({ data: JSON.stringify(credentials) });

      const result = await retrieveCredentials("MyConnection", "Unlock for test");

      expect(mockGetData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:MyConnection:credentials",
        reason: "Unlock for test",
      });
      expect(result).toEqual(credentials);
    });

    it("propagates errors from getData", async () => {
      mockGetData.mockRejectedValue(new Error("User cancelled"));

      await expect(retrieveCredentials("MyConnection", "Unlock")).rejects.toThrow(
        "User cancelled"
      );
    });
  });

  describe("hasCredentials", () => {
    it("returns true when credentials exist", async () => {
      mockHasData.mockResolvedValue(true);
      const result = await hasCredentials("MyConnection");

      expect(mockHasData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:MyConnection:credentials",
      });
      expect(result).toBe(true);
    });

    it("returns false when credentials do not exist", async () => {
      mockHasData.mockResolvedValue(false);
      const result = await hasCredentials("MyConnection");
      expect(result).toBe(false);
    });
  });

  describe("removeCredentials", () => {
    it("calls removeData with correct domain and name", async () => {
      await removeCredentials("MyConnection");

      expect(mockRemoveData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:MyConnection:credentials",
      });
    });
  });
});
