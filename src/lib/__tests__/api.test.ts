import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import {
  saveConnection,
  deleteConnection,
  getConnectionWithCredentials,
} from "../api";
import type { StandardConnectionConfig } from "../types";

const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

vi.mocked(Store.load).mockResolvedValue(mockStore as unknown as Store);

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.get.mockResolvedValue([]);
    mockStore.set.mockResolvedValue(undefined);
    mockStore.save.mockResolvedValue(undefined);
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  describe("saveConnection", () => {
    it("encrypts credentials when secure_storage is true", async () => {
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

      await saveConnection(config, "1234");

      expect(invoke).toHaveBeenCalledWith("store_credentials", {
        connectionName: "SecureConn",
        credentials: { username: "user", password: "pass" },
        pin: "1234",
      });

      // Should store config without credentials
      expect(mockStore.set).toHaveBeenCalledWith("connections", [
        expect.objectContaining({
          type: "standard",
          name: "SecureConn",
          secure_storage: true,
        }),
      ]);
      const storedConfig = vi.mocked(mockStore.set).mock.calls[0][1][0];
      expect(storedConfig.password).toBeUndefined();
      expect(storedConfig.username).toBeUndefined();
    });

    it("throws error when secure_storage is true but no PIN provided", async () => {
      const config: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: true,
      };

      await expect(saveConnection(config)).rejects.toThrow("PIN required");
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

      expect(invoke).not.toHaveBeenCalledWith(
        "store_credentials",
        expect.anything()
      );
      expect(mockStore.set).toHaveBeenCalledWith("connections", [
        expect.objectContaining({
          username: "user",
          password: "pass",
        }),
      ]);
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

      expect(invoke).not.toHaveBeenCalledWith(
        "retrieve_credentials",
        expect.anything()
      );
      expect(result).toEqual(config);
    });

    it("retrieves and merges credentials when secure_storage is true", async () => {
      vi.mocked(invoke).mockResolvedValue({ username: "user", password: "pass" });

      const config: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: true,
      };

      const result = await getConnectionWithCredentials(config, "1234");

      expect(invoke).toHaveBeenCalledWith("retrieve_credentials", {
        connectionName: "SecureConn",
        pin: "1234",
      });
      expect(result).toEqual({
        ...config,
        username: "user",
        password: "pass",
      });
    });

    it("throws error when secure_storage is true but no PIN provided", async () => {
      const config: StandardConnectionConfig = {
        type: "standard",
        name: "SecureConn",
        host: "localhost",
        port: 8182,
        use_ssl: false,
        secure_storage: true,
      };

      await expect(getConnectionWithCredentials(config)).rejects.toThrow("PIN required");
    });
  });

  describe("deleteConnection", () => {
    it("removes encrypted credentials for secure connections", async () => {
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

      expect(invoke).toHaveBeenCalledWith("remove_credentials", {
        connectionName: "SecureConn",
      });
    });

    it("does not remove credentials for non-secure connections", async () => {
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

      expect(invoke).not.toHaveBeenCalledWith(
        "remove_credentials",
        expect.anything()
      );
    });
  });
});
