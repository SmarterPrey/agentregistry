import { App } from 'aws-cdk-lib';
import { KiroAgentGatewayStack } from '../lib/stack';

const app = new App();
new KiroAgentGatewayStack(app, 'KiroAgentGatewayStack');
