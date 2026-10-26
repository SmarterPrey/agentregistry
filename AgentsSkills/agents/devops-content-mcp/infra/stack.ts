import * as path from 'node:path';
import {
  CfnOutput,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_bedrockagentcore as agentcore,
  aws_ecr_assets as ecrAssets,
  aws_iam as iam,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Hosts the devops-content MCP server on AgentCore Runtime. It reads notes from a private bucket that
// the sync-devops-content workflow keeps in step with DevOps-Team-Content.
export interface DevopsContentMcpStackProps extends StackProps {
  readonly runtimeNamePrefix?: string;
  // When set, callers authenticate with a JWT from this OIDC issuer (the Kiro registry's Cognito pool)
  // instead of SigV4, so Kiro can connect as an ordinary remote MCP server.
  readonly jwtAuthorizer?: {
    readonly discoveryUrl: string;
    readonly allowedClients: string[];
  };
}

export class DevopsContentMcpStack extends Stack {
  constructor(scope: Construct, id: string, props: DevopsContentMcpStackProps = {}) {
    super(scope, id, props);

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const image = new ecrAssets.DockerImageAsset(this, 'Image', {
      directory: path.join(__dirname, '..'),
      platform: ecrAssets.Platform.LINUX_ARM64,
    });

    const role = new iam.Role(this, 'RuntimeRole', {
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com', {
        conditions: { StringEquals: { 'aws:SourceAccount': this.account } },
      }),
    });
    contentBucket.grantRead(role);
    image.repository.grantPull(role);
    role.addToPolicy(new iam.PolicyStatement({ actions: ['ecr:GetAuthorizationToken'], resources: ['*'] }));
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents', 'logs:DescribeLogStreams'],
        resources: [`arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`],
      }),
    );

    const runtime = new agentcore.CfnRuntime(this, 'Runtime', {
      agentRuntimeName: `${props.runtimeNamePrefix ?? ''}devops_content_mcp`,
      description: 'MCP server over the DevOps team content notes',
      protocolConfiguration: 'MCP',
      roleArn: role.roleArn,
      agentRuntimeArtifact: { containerConfiguration: { containerUri: image.imageUri } },
      networkConfiguration: { networkMode: 'PUBLIC' },
      environmentVariables: { VAULT_BUCKET: contentBucket.bucketName },
      authorizerConfiguration: props.jwtAuthorizer && {
        customJwtAuthorizer: {
          discoveryUrl: props.jwtAuthorizer.discoveryUrl,
          allowedClients: props.jwtAuthorizer.allowedClients,
        },
      },
    });
    runtime.node.addDependency(role);

    // Without jwtAuthorizer the authorizer is IAM (SigV4): callers need bedrock-agentcore:InvokeAgentRuntime.
    // With it, callers send a Cognito access token as a bearer token and the runtime checks its client_id.
    const encodedArn = Fn.join('', [
      'arn%3Aaws%3Abedrock-agentcore%3A', this.region, '%3A', this.account, '%3Aruntime%2F', runtime.attrAgentRuntimeId,
    ]);
    new CfnOutput(this, 'ContentBucketName', { value: contentBucket.bucketName });
    new CfnOutput(this, 'McpUrl', {
      value: `https://bedrock-agentcore.${this.region}.amazonaws.com/runtimes/${encodedArn}/invocations?qualifier=DEFAULT`,
    });
  }
}
