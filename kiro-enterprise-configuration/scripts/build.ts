import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

// Writes build/mcp-registry.json: the committed allow-list plus the servers whose URLs differ per stage
// and so can't live in the committed file. Today that is the AgentCore registry's MCP endpoint, read from
// the KiroAgentGatewayStack RegistryMcpUrl output and passed as REGISTRY_MCP_URL by the publish workflow.
const doc = JSON.parse(readFileSync(path.join(__dirname, '../mcp-registry.json'), 'utf8')) as { servers: { server: any }[] };

const registryUrl = process.env.REGISTRY_MCP_URL;
if (registryUrl) {
  doc.servers.push({
    server: {
      name: 'agent-registry',
      title: 'Agent Registry',
      description: 'Company agent registry: discover approved MCP servers, agents and skills.',
      version: '1.0.0',
      remotes: [{ type: 'streamable-http', url: registryUrl }],
    },
  });
} else {
  console.warn('REGISTRY_MCP_URL not set; the agent registry is not in the allow-list');
}

const out = path.join(__dirname, '../build/mcp-registry.json');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`wrote ${out} (${doc.servers.length} servers)`);
