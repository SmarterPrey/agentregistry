import { readFileSync } from 'node:fs';
import * as path from 'node:path';

// Checks mcp-registry.json against the constraints in the Kiro MCP governance schema, and that it
// allows every remote server the registries publish.
const REMOTE_MCP_SERVERS: { name: string; url: string }[] = JSON.parse(
  readFileSync(path.join(__dirname, '../../AgentRegistries/shared/remote-mcp-servers.json'), 'utf8'),
);
// Defaults to the committed file; the publish workflow also validates the built one (npm run validate build/mcp-registry.json).
const file = path.resolve(process.argv[2] ?? path.join(__dirname, '../mcp-registry.json'));
const doc = JSON.parse(readFileSync(file, 'utf8')) as { servers: { server: any }[] };
const errors: string[] = [];
const names = new Set<string>();

for (const { server: s } of doc.servers) {
  const where = `server "${s?.name}"`;
  if (!/^[a-zA-Z0-9._-]{3,200}$/.test(s.name ?? '')) errors.push(`${where}: invalid name`);
  if (names.has(s.name)) errors.push(`${where}: duplicate name`);
  names.add(s.name);
  if (!s.description || s.description.length > 100) errors.push(`${where}: description must be 1-100 chars`);
  if (!s.version) errors.push(`${where}: version required`);
  if (s.packages) errors.push(`${where}: local (stdio) servers are not allowed`);
  if (s.remotes?.length !== 1) errors.push(`${where}: exactly one remote required`);
  else if (!/^https:\/\//.test(s.remotes[0].url) || !['streamable-http', 'sse'].includes(s.remotes[0].type)) {
    errors.push(`${where}: remote must be https streamable-http or sse`);
  }
}

const allowed = new Set(doc.servers.map(({ server }) => server.remotes?.[0]?.url));
for (const r of REMOTE_MCP_SERVERS) {
  if (!allowed.has(r.url)) errors.push(`registry server ${r.name} (${r.url}) is missing from the allow-list`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${path.basename(file)} ok (${doc.servers.length} servers)`);
