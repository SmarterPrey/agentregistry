import { readdirSync, readFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import { Fn, Stack, StackProps, aws_agentregistry as ar } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const SKILLS_DIR = path.join(__dirname, '../../skills');

// Publishes every skills/<name>/SKILL.md as a SKILL record in both registries.
export interface SkillsStackProps extends StackProps {
  // "dev-" in the dev stage, matching the exports of the dev AgentRegistries stacks.
  readonly exportPrefix?: string;
}

export class SkillsStack extends Stack {
  constructor(scope: Construct, id: string, props: SkillsStackProps = {}) {
    super(scope, id, props);

    // Registry ARNs exported by the AgentRegistries stacks, which must be deployed first.
    const p = props.exportPrefix ?? '';
    const registries = [
      { id: 'Kiro', arn: Fn.importValue(`${p}AgentRegistries-KiroRegistryArn`) },
      { id: 'Quick', arn: Fn.importValue(`${p}AgentRegistries-QuickRegistryArn`) },
    ];

    const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(path.join(SKILLS_DIR, d.name, 'SKILL.md')))
      .map((d) => d.name);

    for (const skill of skills) {
      const skillMd = readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
      const description = /^description:\s*(.+)$/m.exec(skillMd)?.[1]?.trim() ?? skill;
      const logicalName = skill.replace(/[^a-zA-Z0-9]/g, '_');
      const pascal = skill.replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase());

      for (const registry of registries) {
        new ar.CfnRegistryRecord(this, `${registry.id}${pascal}`, {
          registryId: registry.arn,
          name: logicalName,
          displayName: skill,
          description,
          recordType: 'SKILL',
          descriptors: {
            agentSkillsDefinition: { additionalData: { skillMd: { data: skillMd } } },
          },
        });
      }
    }
  }
}
