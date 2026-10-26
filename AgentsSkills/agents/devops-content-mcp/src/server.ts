import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { VAULT_LOCATION, listNotes, readNote, searchNotes } from './vault';

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const fail = (e: unknown) => ({ ...text(e instanceof Error ? e.message : String(e)), isError: true });

function buildServer(): McpServer {
  const server = new McpServer({ name: 'devops-content', version: '0.1.0' });

  server.registerTool(
    'list_notes',
    { description: 'List all notes in the DevOps team content vault.' },
    async () => text(JSON.stringify(await listNotes(), null, 2)),
  );

  server.registerTool(
    'read_note',
    {
      description: 'Read a note by its vault-relative path, e.g. "Product Catalog/Spotify - Backstage.md".',
      inputSchema: { path: z.string() },
    },
    async ({ path }) => {
      try {
        return text(await readNote(path));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    'search_notes',
    {
      description: 'Case-insensitive text search across note titles and bodies.',
      inputSchema: { query: z.string().min(1), limit: z.number().int().min(1).max(100).optional() },
    },
    async ({ query, limit }) => text(JSON.stringify(await searchNotes(query, limit), null, 2)),
  );

  return server;
}

async function main() {
  if (process.argv.includes('--stdio')) {
    await buildServer().connect(new StdioServerTransport());
    return;
  }

  // Stateless streamable HTTP on 0.0.0.0:8000/mcp, the contract for MCP servers on AgentCore Runtime.
  const port = Number(process.env.PORT ?? 8000);
  http
    .createServer(async (req, res) => {
      if (req.url !== '/mcp') {
        res.writeHead(404).end();
        return;
      }
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res);
    })
    .listen(port, '0.0.0.0', () => console.error(`devops-content MCP on :${port}/mcp, vault ${VAULT_LOCATION}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
