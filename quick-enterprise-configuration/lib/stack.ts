import { CfnOutput, Fn, Stack, StackProps, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface QuickEnterpriseConfigStackProps extends StackProps {
  // "dev-" in the dev stage; selects the registry export and names the role.
  readonly prefix: string;
}

// Customer-managed service role for Amazon Quick's Agent Registry integration. It can read only the
// Quick registry from the AgentRegistries stack (AWS_IAM, the only kind Quick can link), so Quick can
// never list or fetch records from any other registry in the account.
//
// Manual steps (no API exists for them): in the Quick admin console choose this role as the account
// service role, then link the registry under Manage account > Permissions > AWS Agent Registry.
export class QuickEnterpriseConfigStack extends Stack {
  constructor(scope: Construct, id: string, props: QuickEnterpriseConfigStackProps) {
    super(scope, id, props);

    const registryArn = Fn.importValue(`${props.prefix}AgentRegistries-QuickRegistryArn`);

    const role = new iam.Role(this, 'ServiceRole', {
      roleName: `${props.prefix}quick-agent-registry-service-role`,
      description: 'Amazon Quick service role limited to the Quick agent registry',
      assumedBy: new iam.ServicePrincipal('quicksight.amazonaws.com', {
        conditions: { StringEquals: { 'aws:SourceAccount': this.account } },
      }),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadQuickRegistryOnly',
        actions: [
          'agent-registry:ListDiscoverableRegistryRecords',
          'agent-registry:SearchDiscoverableRegistryRecords',
          'agent-registry:GetDiscoverableRegistryRecord',
        ],
        resources: [registryArn, `${registryArn}/record/*`],
      }),
    );

    new CfnOutput(this, 'ServiceRoleArn', { value: role.roleArn });
  }
}
