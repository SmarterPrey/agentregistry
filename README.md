# agentregistry

Umbrella repo that pins the three repos behind the AgentCore registries as submodules.

| Submodule | Contents | Owners |
|---|---|---|
| `AgentRegistries` | Kiro and Quick registry CDK apps, devops-content MCP server | `AgentRegistryDevs` |
| `AgentsSkills` | Agents and skills | `AgentsSkillsDevs` |
| `DevOps-Team-Content` | Obsidian vault served by the MCP server | `DevOpsDevs` |

```
git clone --recurse-submodules https://github.com/SmarterPrey/agentregistry.git
git submodule update --remote   # move submodules to their latest main
```
