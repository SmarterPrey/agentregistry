# AgentRegistries

CDK apps for the AgentCore registries.

| Path | Purpose |
|---|---|
| `packages/kiro-agent-gateway` | Registry consumed by Kiro (`CUSTOM_JWT`) |
| `packages/quick-agent-registry` | Registry linked to Amazon Quick (`AWS_IAM`) |

```
npm install
npm run build
npm run synth
```

## Registry records

`shared/remote-mcp-servers.ts` adds MCP records to both registries: GitHub, Wiz, Microsoft Learn, and the devops-content server. The devops-content record needs its endpoint, passed as context (the deploy workflow reads it from the `DevopsContentMcpStack` output):

```
npx cdk synth -c devopsContentMcpUrl=https://.../invocations?qualifier=DEFAULT
```

Each registry stack exports its ARN (`AgentRegistries-KiroRegistryArn`, `AgentRegistries-QuickRegistryArn`) for the skills publisher.

