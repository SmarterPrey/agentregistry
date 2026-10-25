import { App } from 'aws-cdk-lib';
import { GithubOidcStack } from '../lib/stack';

const app = new App();
new GithubOidcStack(app, 'GithubOidcStack', {
  repo: app.node.tryGetContext('repo') ?? 'SmarterPrey/devcore',
  // This repo uses GitHub's immutable subject (survives renames/transfers); override with -c subjectPrefix=...
  subjectPrefix: app.node.tryGetContext('subjectPrefix') ?? 'repo:SmarterPrey@135157929/devcore@1429268110',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
