import "server-only";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { del, get, list, put } from "@vercel/blob";
import { env } from "./env";

// Private file storage for child-generated content (story pictures and narration; D-070). Production
// uses a PRIVATE Vercel Blob store: nothing is publicly reachable; files are served only through our
// own routes after the child's or parent's access is checked. Local development without a Blob token
// writes to `.data/` (git-ignored) through the same interface. Paths are built by our code only
// (`stories/<childId>/<storyId>/...`), never from user input.

export type StoredFile = { stream: ReadableStream<Uint8Array>; contentType: string };

const LOCAL_ROOT = join(process.cwd(), ".data", "blob");

function blobConfigured(): boolean {
  const e = env();
  return Boolean(e.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export function storageConfigured(): boolean {
  return blobConfigured() || process.env.NODE_ENV !== "production";
}

function localPath(path: string): string {
  const p = normalize(join(LOCAL_ROOT, path));
  if (!p.startsWith(LOCAL_ROOT)) throw new Error("bad path");
  return p;
}

export async function putFile(path: string, bytes: Buffer, contentType: string): Promise<void> {
  if (blobConfigured()) {
    await put(path, bytes, { access: "private", contentType, allowOverwrite: true, addRandomSuffix: false });
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Storage is not configured (BLOB_READ_WRITE_TOKEN / connected store)");
  const p = localPath(path);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, bytes);
  await writeFile(`${p}.type`, contentType);
}

export async function getFile(path: string): Promise<StoredFile | null> {
  if (blobConfigured()) {
    const r = await get(path, { access: "private" });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    return { stream: r.stream, contentType: r.blob.contentType };
  }
  try {
    const p = localPath(path);
    const [bytes, type] = await Promise.all([readFile(p), readFile(`${p}.type`, "utf8")]);
    return { stream: new Blob([new Uint8Array(bytes)]).stream(), contentType: type };
  } catch {
    return null;
  }
}

/** Deletes every file under a prefix (a story, or all of a child's stories). */
export async function deletePrefix(prefix: string): Promise<number> {
  if (blobConfigured()) {
    let n = 0;
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      if (page.blobs.length) await del(page.blobs.map((b) => b.url));
      n += page.blobs.length;
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return n;
  }
  const p = localPath(prefix);
  try {
    const n = (await readdir(p, { recursive: true })).length;
    await rm(p, { recursive: true, force: true });
    return n;
  } catch {
    return 0;
  }
}
