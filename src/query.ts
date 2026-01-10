import { invoke } from "@tauri-apps/api/core";

export async function executeQuery(query: string): Promise<string> {
  return await invoke<string>("execute_query", { query });
}
