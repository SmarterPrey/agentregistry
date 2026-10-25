import { App } from 'aws-cdk-lib';
import { GithubOidcStack } from '../lib/stack';

const app = new App();
new GithubOidcStack(app, 'GithubOidcStack', {
  repo: app.node.tryGetContext('repo') ?? 'SmarterPrey/devcore',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
