import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { Annotations, aws_agentregistry as ar } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface RemoteMcpServer {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
}

// Shared with kiro-enterprise-configuration, which checks its allow-list against this file.
const REMOTE_MCP_SERVERS: RemoteMcpServer[] = JSON.parse(
  readFileSync(path.join(__dirname, 'remote-mcp-servers.json'), 'utf8'),
);

// The descriptors carry connection metadata only; clients authenticate to each server themselves.
export function addRemoteMcpServers(scope: Construct, registry: ar.CfnRegistry): void {
  for (const s of REMOTE_MCP_SERVERS) {
    new ar.CfnRegistryRecord(scope, `${s.id}Record`, {
      registryId: registry.attrRegistryArn,
      name: s.name,
      displayName: s.title,
      description: s.description,
      recordType: 'MCP',
      descriptors: {
        mcpServer: {
          dataSchemaVersion: '2025-12-11',
          data: JSON.stringify({
            name: `remote/${s.name}`,
            title: s.title,
            description: s.description,
            version: '1.0.0',
            remotes: [{ type: 'streamable-http', url: s.url }],
          }),
        },
      },
    });
  }
}

const DEVOPS_CONTENT_TOOLS = [
  {
    name: 'list_notes',
    description: 'List all notes in the DevOps team content vault.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'read_note',
    description: 'Read a note by its vault-relative path, e.g. "Product Catalog/Spotify - Backstage.md".',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'search_notes',
    description: 'Case-insensitive text search across note titles and bodies.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', minLength: 1 }, limit: { type: 'integer', minimum: 1, maximum: 100 } },
      required: ['query'],
    },
  },
];

// The server (packages/devops-content-mcp) has no deployed endpoint yet, so the URL comes from
// context: cdk synth -c devopsContentMcpUrl=https://.../mcp
export function addDevopsContentMcp(scope: Construct, registry: ar.CfnRegistry): void {
  const url = scope.node.tryGetContext('devopsContentMcpUrl') as string | undefined;
  if (!url) {
    Annotations.of(scope).addWarning('devopsContentMcpUrl context not set; skipping the devops-content registry record');
    return;
  }
  const description = 'Read and search the DevOps team content vault (list_notes, read_note, search_notes).';
  new ar.CfnRegistryRecord(scope, 'DevopsContentRecord', {
    registryId: registry.attrRegistryArn,
    name: 'devopscontent',
    displayName: 'DevOps Team Content',
    description,
    recordType: 'MCP',
    descriptors: {
      mcpServer: {
        dataSchemaVersion: '2025-12-11',
        data: JSON.stringify({
          name: 'devops/content',
          title: 'DevOps Team Content',
          description,
          version: '0.1.0',
          remotes: [{ type: 'streamable-http', url }],
        }),
        additionalData: {
          tools: {
            dataSchemaVersion: '2025-06-18',
            data: JSON.stringify({ tools: DEVOPS_CONTENT_TOOLS }),
          },
        },
      },
    },
  });
}
