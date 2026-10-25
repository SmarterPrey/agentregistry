import { App } from 'aws-cdk-lib';
import { QuickAgentRegistryStack } from '../lib/stack';

const app = new App();
new QuickAgentRegistryStack(app, 'QuickAgentRegistryStack');
