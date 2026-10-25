import { App } from 'aws-cdk-lib';
import { stackPrefix } from '../../../shared/stage';
import { QuickAgentRegistryStack } from '../lib/stack';

const app = new App();
new QuickAgentRegistryStack(app, `${stackPrefix(app)}QuickAgentRegistryStack`);
