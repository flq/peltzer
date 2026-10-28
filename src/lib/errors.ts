// Tauri's invoke() rejects with the command's error string, while JS code throws Error objects
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
