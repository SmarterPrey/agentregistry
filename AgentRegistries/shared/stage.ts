import { Construct } from 'constructs';

// Set with `cdk deploy -c stage=dev`. Anything else (including unset) is prod, which has no prefix.
export function isDev(scope: Construct): boolean {
  return scope.node.tryGetContext('stage') === 'dev';
}

// For CloudFormation stack names and export names, which allow hyphens: "dev-".
export const stackPrefix = (scope: Construct) => (isDev(scope) ? 'dev-' : '');

// For service resource names that only allow letters, digits and underscores: "dev_".
export const resourcePrefix = (scope: Construct) => (isDev(scope) ? 'dev_' : '');
