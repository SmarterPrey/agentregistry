import { Stack, StackProps, aws_agentregistry as ar } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Linked to Amazon Quick by an admin; must be AWS_IAM, same account and Region.
export class QuickAgentRegistryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ar.CfnRegistry(this, 'Registry', {
      name: 'quick_agent_registry',
      description: 'Business-facing MCP servers and agents for Amazon Quick',
      authorizerType: 'AWS_IAM',
    });
  }
}
