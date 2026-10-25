import { promises as fs } from 'node:fs';
import path from 'node:path';

export const VAULT_DIR = path.resolve(
  process.env.VAULT_DIR ?? path.join(__dirname, '../../../DevOps-Team-Content'),
);

export interface Note {
  path: string; // vault-relative, forward slashes
  title: string;
}

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

export async function listNotes(): Promise<Note[]> {
  const files = await walk(VAULT_DIR);
  return files
    .map((f) => path.relative(VAULT_DIR, f).split(path.sep).join('/'))
    .sort()
    .map((p) => ({ path: p, title: path.basename(p, '.md') }));
}

// Resolves a vault-relative path, rejecting anything that escapes the vault or is hidden.
export function resolveNote(notePath: string): string {
  const full = path.resolve(VAULT_DIR, notePath);
  const rel = path.relative(VAULT_DIR, full);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some((s) => s.startsWith('.'))) {
    throw new Error(`Invalid note path: ${notePath}`);
  }
  if (!full.endsWith('.md')) throw new Error('Only .md notes can be read');
  return full;
}

export async function readNote(notePath: string): Promise<string> {
  return fs.readFile(resolveNote(notePath), 'utf8');
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
