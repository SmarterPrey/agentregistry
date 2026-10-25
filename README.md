# agentregistry

Umbrella repo for the AgentCore registries that publish MCP servers, agents, skills, and team content to Kiro and Amazon Quick. It holds no code of its own. It pins three repos as git submodules so they can be cloned and versioned together while each is owned and changed independently.

## Repos

| Submodule | Contents | Owning team |
|---|---|---|
| [AgentRegistries](https://github.com/SmarterPrey/AgentRegistries) | CDK apps for the Kiro and Quick registries, and the MCP server over the vault | `AgentRegistryDevs` |
| [AgentsSkills](https://github.com/SmarterPrey/AgentsSkills) | Agents (`agents/`) and skills (`skills/`) | `AgentsSkillsDevs` |
| [DevOps-Team-Content](https://github.com/SmarterPrey/DevOps-Team-Content) | Obsidian vault (Markdown notes) served by the MCP server | `DevOpsDevs` |

All three are private. This umbrella repo is public, so the submodule URLs are visible but their contents are not.

## How the pieces fit

```
DevOps-Team-Content  ──read by──▶  AgentRegistries/packages/devops-content-mcp
                                          │ registered as a record in
                                          ▼
                      AgentRegistries/packages/kiro-agent-gateway   (CUSTOM_JWT, for Kiro)
                      AgentRegistries/packages/quick-agent-registry (AWS_IAM, for Amazon Quick)
                                          ▲
AgentsSkills  ──agents and skills published to──┘
```

- **Two registries** because consumers authenticate differently. Kiro connects through the registry's MCP endpoint with OAuth. Amazon Quick links one `AWS_IAM` registry in the same account and Region. `AuthorizerType` can't change after creation without replacing the registry.
- **`devops-content-mcp`** exposes the vault through three tools: `list_notes`, `read_note`, and `search_notes`. It reads the vault from `VAULT_DIR`. The default, `../../../DevOps-Team-Content`, works because the vault is a sibling submodule in this repo.

## Getting started

```
git clone --recurse-submodules https://github.com/SmarterPrey/agentregistry.git
cd agentregistry/AgentRegistries
npm install
npm run build
npm run synth
```

Already cloned without submodules: `git submodule update --init --recursive`.

## Working in this repo

Changes happen in the submodules, not here.

1. Open a pull request in the owning submodule repo. Its team reviews it.
2. After it merges, bump the pin here:
   ```
   git submodule update --remote <Submodule>
   git add <Submodule>
   git commit -m "Bump <Submodule>"
   ```
3. Open a pull request for the bump. The owning team approves it.

`git submodule update --remote` moves every submodule to the latest `main` of its repo.

## Ownership and review

- Each submodule has its own `.github/CODEOWNERS` that assigns every file to its team. Teams have **write** access to their own repo only.
- `main` in each submodule requires a pull request with one approval, including a code owner. Admins can bypass this.
- This repo's [CODEOWNERS](.github/CODEOWNERS) maps each submodule path to its team, so a pin bump needs that team's approval. GitHub honors a team in CODEOWNERS only if it has write access to the repo. The teams don't have write access here, so those lines are currently flagged invalid and you (`@ppottorff`) own everything. Either grant the teams write access here or remove the team lines.

## Status

- `kiro-agent-gateway` still needs its JWT authorizer settings (`discoveryConfiguration`).
- Nothing is deployed, and no registry records exist yet.
- `AgentsSkills` holds placeholders only.
