import { App } from 'aws-cdk-lib';
import { DevopsContentMcpStack } from './stack';

const app = new App();
// `-c stage=dev` deploys a separate stack with dev- / dev_ prefixed names alongside prod.
const dev = app.node.tryGetContext('stage') === 'dev';
new DevopsContentMcpStack(app, `${dev ? 'dev-' : ''}DevopsContentMcpStack`, { runtimeNamePrefix: dev ? 'dev_' : '' });
