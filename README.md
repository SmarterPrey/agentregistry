# AgentRegistries

CDK apps for the AgentCore registries, and the MCP server that serves the DevOps team content.

| Path | Purpose |
|---|---|
| `packages/kiro-agent-gateway` | Registry consumed by Kiro (`CUSTOM_JWT`) |
| `packages/quick-agent-registry` | Registry linked to Amazon Quick (`AWS_IAM`) |
| `packages/devops-content-mcp` | MCP server over the DevOps-Team-Content vault (`list_notes`, `read_note`, `search_notes`) |

```
npm install
npm run build
npm run synth
```

## devops-content-mcp

```
npm run build -w @agentregistry/devops-content-mcp
npm start -w @agentregistry/devops-content-mcp            # streamable HTTP on :8000/mcp
node packages/devops-content-mcp/dist/server.js --stdio    # stdio, for local clients
```

`VAULT_DIR` sets the vault path. The default, `../../../DevOps-Team-Content`, assumes this repo is checked out next to the vault as a submodule of the umbrella repo.
