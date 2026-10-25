import { App } from 'aws-cdk-lib';
import { stackPrefix } from '../../../shared/stage';
import { KiroAgentGatewayStack } from '../lib/stack';

const app = new App();
new KiroAgentGatewayStack(app, `${stackPrefix(app)}KiroAgentGatewayStack`);
