# kiro-enterprise-configuration

Hosts the Kiro MCP allow-list. `mcp-registry.json` lists the servers Kiro users may add. The publish workflow
adds the stage's agent registry endpoint (`RegistryMcpUrl` from `KiroAgentGatewayStack`) as `agent-registry`,
validates the result, and uploads it. Set the stack's `AllowListUrl` output as the MCP Registry URL in the Kiro
console (Settings > Q Developer tab).

## Connecting to the agent registry

The allow-list only permits a server. The sign-in settings go in the user's `~/.kiro/settings/mcp.json`,
because the registry uses Cognito, which has no dynamic client registration. Take `clientId` from the
`KiroClientId` stack output; `redirectUri` ends at the port (Kiro appends `/oauth/callback`), and the Cognito
client allows `localhost` and `127.0.0.1` on port 3334.

```json
{
  "mcpServers": {
    "agent-registry": {
      "url": "<RegistryMcpUrl output>",
      "oauth": {
        "clientId": "<KiroClientId output>",
        "redirectUri": "http://127.0.0.1:3334",
        "oauthScopes": ["openid", "email", "profile"]
      }
    }
  }
}
```

Then authenticate from the MCP panel. Users are added to the Cognito pool by an admin (self sign-up is off).
