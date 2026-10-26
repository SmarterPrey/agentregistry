import { App } from 'aws-cdk-lib';
import { QuickEnterpriseConfigStack } from '../lib/stack';

const app = new App();
// `-c stage=dev` deploys a separate dev- prefixed stack that targets the dev registry.
const prefix = app.node.tryGetContext('stage') === 'dev' ? 'dev-' : '';
new QuickEnterpriseConfigStack(app, `${prefix}QuickEnterpriseConfigStack`, { prefix });
