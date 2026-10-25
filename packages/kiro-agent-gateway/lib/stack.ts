import { Stack, StackProps, aws_agentregistry as ar } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Consumed by Kiro through the registry's MCP endpoint (OAuth / DCR).
// AuthorizerType can't be changed later without replacing the registry.
export class KiroAgentGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ar.CfnRegistry(this, 'Registry', {
      name: 'kiro_agent_gateway',
      description: 'MCP servers, agents, and skills for Kiro',
      authorizerType: 'CUSTOM_JWT',
      // TODO: discoveryConfiguration with the JWT authorizer settings
    });
  }
}
