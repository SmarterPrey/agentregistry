import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

// Notes come from an S3 bucket when VAULT_BUCKET is set (deployed), else from a local directory.
const VAULT_BUCKET = process.env.VAULT_BUCKET;
const VAULT_PREFIX = process.env.VAULT_PREFIX ?? '';
const CACHE_TTL_MS = Number(process.env.VAULT_CACHE_TTL_MS ?? 60_000);

export const VAULT_DIR = path.resolve(
  process.env.VAULT_DIR ?? path.join(__dirname, '../../../../DevOps-Team-Content'),
);
export const VAULT_LOCATION = VAULT_BUCKET ? `s3://${VAULT_BUCKET}/${VAULT_PREFIX}` : VAULT_DIR;

export interface Note {
  path: string; // vault-relative, forward slashes
  title: string;
}

const isHidden = (notePath: string) => notePath.split('/').some((s) => s.startsWith('.'));

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue; // .obsidian, .DS_Store, .trash
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

async function listLocal(): Promise<string[]> {
  return (await walk(VAULT_DIR)).map((f) => path.relative(VAULT_DIR, f).split(path.sep).join('/'));
}

let s3: S3Client | undefined;
const client = () => (s3 ??= new S3Client({}));

async function listS3(): Promise<string[]> {
  const out: string[] = [];
  let token: string | undefined;
  do {
    const page = await client().send(
      new ListObjectsV2Command({ Bucket: VAULT_BUCKET, Prefix: VAULT_PREFIX, ContinuationToken: token }),
    );
    for (const obj of page.Contents ?? []) {
      const rel = obj.Key!.slice(VAULT_PREFIX.length);
      if (rel.endsWith('.md') && !isHidden(rel)) out.push(rel);
    }
    token = page.NextContinuationToken;
  } while (token);
  return out;
}

export async function listNotes(): Promise<Note[]> {
  const paths = VAULT_BUCKET ? await listS3() : await listLocal();
  return paths.sort().map((p) => ({ path: p, title: path.basename(p, '.md') }));
}

// Rejects anything that escapes the vault, is hidden, or isn't a .md note. Returns the normalized path.
export function validateNotePath(notePath: string): string {
  const normalized = path.posix.normalize(notePath.split(path.sep).join('/'));
  if (normalized.startsWith('..') || path.posix.isAbsolute(normalized) || isHidden(normalized)) {
    throw new Error(`Invalid note path: ${notePath}`);
  }
  if (!normalized.endsWith('.md')) throw new Error('Only .md notes can be read');
  return normalized;
}

const noteCache = new Map<string, { at: number; text: string }>();

export async function readNote(notePath: string): Promise<string> {
  const rel = validateNotePath(notePath);
  if (!VAULT_BUCKET) return fs.readFile(path.join(VAULT_DIR, rel), 'utf8');

  const cached = noteCache.get(rel);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.text;
  const res = await client().send(new GetObjectCommand({ Bucket: VAULT_BUCKET, Key: VAULT_PREFIX + rel }));
  const text = await res.Body!.transformToString('utf-8');
  noteCache.set(rel, { at: Date.now(), text });
  return text;
}

export interface SearchHit {
  path: string;
  line: number;
  text: string;
}

export async function searchNotes(query: string, limit = 20): Promise<SearchHit[]> {
  const q = query.toLowerCase();
  const hits: SearchHit[] = [];
  for (const note of await listNotes()) {
    const lines = (await readNote(note.path)).split('\n');
    for (let i = 0; i < lines.length && hits.length < limit; i++) {
      if (lines[i].toLowerCase().includes(q) || note.title.toLowerCase().includes(q)) {
        hits.push({ path: note.path, line: i + 1, text: lines[i].trim() });
        if (note.title.toLowerCase().includes(q) && !lines[i].toLowerCase().includes(q)) break;
      }
    }
    if (hits.length >= limit) break;
  }
  return hits;
}
