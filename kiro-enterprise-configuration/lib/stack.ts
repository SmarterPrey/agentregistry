import { CfnOutput, RemovalPolicy, Stack, StackProps, aws_cloudfront as cloudfront, aws_cloudfront_origins as origins, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Serves the Kiro MCP allow-list (mcp-registry.json) over HTTPS from CloudFront in front of a private
// bucket. The publish workflow uploads the file; this stack only provides the location.
//
// Manual step (no API exists for it): in the Kiro console, Settings > Q Developer tab, turn MCP on and
// set "MCP Registry URL" to the AllowListUrl output. Kiro enforces the list on the client.
export class KiroEnterpriseConfigStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ConfigBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Kiro MCP allow-list',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    new CfnOutput(this, 'ConfigBucketName', { value: bucket.bucketName });
    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new CfnOutput(this, 'AllowListUrl', { value: `https://${distribution.distributionDomainName}/mcp-registry.json` });
  }
}
