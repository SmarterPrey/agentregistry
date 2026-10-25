# devcore

Monorepo for infrastructure stacks that deploy AI and developer services on AWS, including the AgentCore registries and MCP services used by Kiro and Amazon Quick. It holds the stacks and the supporting agents, skills, and team content in one repository so they are versioned together.

## Layout

| Directory | Contents | Owning team |
|---|---|---|
| [AgentRegistries](AgentRegistries) | CDK apps for the Kiro and Quick registries, and the MCP server over the vault | `AgentRegistryDevs` |
| [AgentsSkills](AgentsSkills) | Agents (`agents/`) and skills (`skills/`) | `AgentsSkillsDevs` |
| [DevOps-Team-Content](DevOps-Team-Content) | Obsidian vault (Markdown notes) served by the MCP server | `DevOpsDevs` |

These began as separate repositories (`SmarterPrey/AgentRegistries`, `AgentsSkills`, `DevOps-Team-Content`) and were merged here with their history preserved. Those repositories are no longer the source of truth.

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
- **`devops-content-mcp`** exposes the vault through three tools: `list_notes`, `read_note`, and `search_notes`. It reads the vault from `VAULT_DIR`. The default, `../../../DevOps-Team-Content`, works because the vault is a sibling directory in this repo.

## Getting started

```
git clone https://github.com/SmarterPrey/devcore.git
cd devcore/AgentRegistries
npm install
npm run build
npm run synth
```

## Working in this repo

Open a pull request against `main`. [CODEOWNERS](.github/CODEOWNERS) requests review from the team that owns each directory you touch. A change that spans directories needs approval from each owning team, and lands as one commit.

## Ownership and review

- GitHub only reads the root CODEOWNERS file, so ownership is assigned per directory there.
- GitHub honors a team in CODEOWNERS only if it has write access to the repo. The teams don't have write access here yet, so those lines are flagged invalid and `@ppottorff` owns everything. Either grant the teams write access or remove the team lines.
- Access can no longer be split per directory. Anyone with write access can change any directory.

## Status

- `kiro-agent-gateway` still needs its JWT authorizer settings (`discoveryConfiguration`).
- Nothing is deployed, and no registry records exist yet.
- `AgentsSkills` holds placeholders only.
