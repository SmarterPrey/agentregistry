import { App } from 'aws-cdk-lib';
import { KiroEnterpriseConfigStack } from '../lib/stack';

const app = new App();
const prefix = app.node.tryGetContext('stage') === 'dev' ? 'dev-' : '';
new KiroEnterpriseConfigStack(app, `${prefix}KiroEnterpriseConfigStack`);
