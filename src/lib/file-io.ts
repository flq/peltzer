import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const GREMLIN_FILTER = [{ name: "Gremlin", extensions: ["gremlin"] }];

export async function openQueryFile(): Promise<{ filePath: string; content: string } | null> {
  const filePath = await open({ filters: GREMLIN_FILTER });
  if (!filePath) return null;
  const content = await readTextFile(filePath);
  return { filePath, content };
}

export async function saveQueryToFile(
  content: string,
  existingPath?: string,
): Promise<string | null> {
  const filePath = existingPath ?? await save({ filters: GREMLIN_FILTER });
  if (!filePath) return null;
  await writeTextFile(filePath, content);
  return filePath;
}
