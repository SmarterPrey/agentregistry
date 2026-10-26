import { CfnOutput, RemovalPolicy, Stack, StackProps, aws_agentregistry as ar, aws_cognito as cognito } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { resourcePrefix, stackPrefix } from '../../../shared/stage';
import { addDevopsContentMcp, addRemoteMcpServers } from '../../../shared/remote-mcp-servers';

// Consumed by Kiro through the registry's MCP endpoint. Kiro signs users in with Cognito (authorization
// code + PKCE, pre-registered client) and the registry accepts only tokens issued to that client.
// Cognito has no dynamic client registration, so the client ID is configured in Kiro, not discovered.
// AuthorizerType can't be changed later without replacing the registry.
export class KiroAgentGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${stackPrefix(this)}kiro-agent-gateway`,
      selfSignUpEnabled: false, // users are added by an admin
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Where the browser returns after sign-in. Kiro takes the port from the oauth.redirectUri in the user's
    // mcp.json (default 3334 here) and appends /oauth/callback; Cognito matches the URL exactly, so allow
    // both loopback hosts. Override with -c kiroOAuthCallbackUrls=http://127.0.0.1:<port>/oauth/callback[,...].
    const callbackUrls = ((this.node.tryGetContext('kiroOAuthCallbackUrls') as string | undefined) ??
      'http://localhost:3334/oauth/callback,http://127.0.0.1:3334/oauth/callback')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const client = userPool.addClient('KiroClient', {
      userPoolClientName: 'kiro',
      generateSecret: false, // public client; PKCE protects the code exchange
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls,
      },
    });

    const domain = userPool.addDomain('Domain', {
      cognitoDomain: { domainPrefix: `${stackPrefix(this)}kiro-registry-${this.account}` },
    });

    const registry = new ar.CfnRegistry(this, 'Registry', {
      name: `${resourcePrefix(this)}kiro_agent_gateway`,
      description: 'MCP servers, agents, and skills for Kiro',
      authorizerType: 'CUSTOM_JWT',
      discoveryConfiguration: {
        authorizerConfiguration: {
          customJwtAuthorizer: {
            discoveryUrl: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}/.well-known/openid-configuration`,
            allowedClients: [client.userPoolClientId],
          },
        },
      },
    });

    // Imported by the skills publisher (AgentsSkills/skills-publisher).
    new CfnOutput(this, 'RegistryArn', { value: registry.attrRegistryArn, exportName: `${stackPrefix(this)}AgentRegistries-KiroRegistryArn` });

    // What a Kiro user needs (see the root README).
    new CfnOutput(this, 'RegistryMcpUrl', { value: `https://agent-registry.${this.region}.api.aws/registry/${registry.attrRegistryId}/mcp` });
    new CfnOutput(this, 'KiroClientId', { value: client.userPoolClientId });
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'SignInDomain', { value: domain.baseUrl() });

    addRemoteMcpServers(this, registry);
    addDevopsContentMcp(this, registry);
  }
}
