import {
  checkStatus,
  setData,
  getData,
  hasData,
  removeData,
} from "@choochmeque/tauri-plugin-biometry-api";

const DOMAIN = "com.peltzer";

export interface Credentials {
  username?: string;
  password?: string;
  key?: string;
}

export async function isBiometryAvailable(): Promise<boolean> {
  try {
    const status = await checkStatus();
    return status.isAvailable;
  } catch {
    return false;
  }
}

export async function storeCredentials(
  connectionName: string,
  credentials: Credentials
): Promise<void> {
  await setData({
    domain: DOMAIN,
    name: `connection:${connectionName}:credentials`,
    data: JSON.stringify(credentials),
  });
}

export async function retrieveCredentials(
  connectionName: string,
  reason: string
): Promise<Credentials> {
  const result = await getData({
    domain: DOMAIN,
    name: `connection:${connectionName}:credentials`,
    reason,
  });
  return JSON.parse(result.data);
}

export async function hasCredentials(connectionName: string): Promise<boolean> {
  return hasData({
    domain: DOMAIN,
    name: `connection:${connectionName}:credentials`,
  });
}

export async function removeCredentials(connectionName: string): Promise<void> {
  await removeData({
    domain: DOMAIN,
    name: `connection:${connectionName}:credentials`,
  });
}
