import { describe, it, expect, vi, beforeEach } from "vitest";
import { Store } from "@tauri-apps/plugin-store";
import {
  mockSetData,
  mockGetData,
  mockRemoveData,
} from "../../test/setup";
import {
  saveConnection,
  deleteConnection,
  getConnectionWithCredentials,
  getSavedConnections,
} from "../api";
import type { StandardConnectionConfig, CosmosConnectionConfig } from "../types";

const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn(),
};

vi.mocked(Store.load).mockResolvedValue(mockStore as unknown as Store);

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.get.mockResolvedValue([]);
    mockStore.set.mockResolvedValue(undefined);
    mockStore.save.mockResolvedValue(undefined);
  });

  describe("saveConnection", () => {
    it("stores credentials via biometry when secure_storage is true", async () => {
      const config: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        username: "user",
        password: "pass",
        use_ssl: false,
        secure_storage: true,
      };

      await saveConnection(config);

      expect(mockSetData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:SecureConn:credentials",
        data: JSON.stringify({ username: "user", password: "pass" }),
      });

      // Should store config without credentials
      expect(mockStore.set).toHaveBeenCalledWith("connections", [
        expect.objectContaining({
          type: "standard",
          name: "SecureConn",
          secure_storage: true,
        }),
      ]);
      // The stored config should not have password
      const storedConfig = vi.mocked(mockStore.set).mock.calls[0][1][0];
      expect(storedConfig.password).toBeUndefined();
      expect(storedConfig.username).toBeUndefined();
    });

    it("stores credentials in JSON when secure_storage is false", async () => {
      const config: StandardConnectionConfig = {
        type: "standard",
        name: "PlainConn",
        host: "localhost",
        port: 8182,
        username: "user",
        password: "pass",
        use_ssl: false,
        secure_storage: false,
      };

      await saveConnection(config);

      expect(mockSetData).not.toHaveBeenCalled();
      expect(mockStore.set).toHaveBeenCalledWith("connections", [
        expect.objectContaining({
          username: "user",
          password: "pass",
        }),
      ]);
    });

    it("stores Cosmos key via biometry when secure_storage is true", async () => {
      const config: CosmosConnectionConfig = {
        type: "cosmos",
        name: "SecureCosmos",
        endpoint: "test.cosmos.azure.com",
        database: "db",
        container: "c",
        key: "secret-key",
        secure_storage: true,
      };

      await saveConnection(config);

      expect(mockSetData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:SecureCosmos:credentials",
        data: JSON.stringify({ key: "secret-key" }),
      });

      const storedConfig = vi.mocked(mockStore.set).mock.calls[0][1][0];
      expect(storedConfig.key).toBeUndefined();
    });
  });

  describe("getConnectionWithCredentials", () => {
    it("returns config as-is when secure_storage is false", async () => {
      const config: StandardConnectionConfig = {
        type: "standard",
        name: "PlainConn",
        host: "localhost",
        port: 8182,
        username: "user",
        password: "pass",
        use_ssl: false,
        secure_storage: false,
      };

      const result = await getConnectionWithCredentials(config);

      expect(mockGetData).not.toHaveBeenCalled();
      expect(result).toEqual(config);
    });

    it("retrieves and merges credentials when secure_storage is true", async () => {
      const config: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: true,
      };

      mockGetData.mockResolvedValue({
        data: JSON.stringify({ username: "user", password: "pass" }),
      });

      const result = await getConnectionWithCredentials(config);

      expect(mockGetData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:SecureConn:credentials",
        reason: 'Unlock credentials for "SecureConn"',
      });
      expect(result).toEqual({
        ...config,
        username: "user",
        password: "pass",
      });
    });
  });

  describe("deleteConnection", () => {
    it("removes biometry credentials for secure connections", async () => {
      const secureConn: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: true,
      };
      mockStore.get.mockResolvedValue([secureConn]);

      await deleteConnection("SecureConn");

      expect(mockRemoveData).toHaveBeenCalledWith({
        domain: "com.peltzer",
        name: "connection:SecureConn:credentials",
      });
    });

    it("does not call removeData for non-secure connections", async () => {
      const plainConn: StandardConnectionConfig = {
        type: "standard",
        name: "PlainConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: false,
      };
      mockStore.get.mockResolvedValue([plainConn]);

      await deleteConnection("PlainConn");

      expect(mockRemoveData).not.toHaveBeenCalled();
    });

    it("ignores errors when removing biometry credentials", async () => {
      const secureConn: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: true,
      };
      mockStore.get.mockResolvedValue([secureConn]);
      mockRemoveData.mockRejectedValue(new Error("Not found"));

      await expect(deleteConnection("SecureConn")).resolves.not.toThrow();
    });
  });
});
