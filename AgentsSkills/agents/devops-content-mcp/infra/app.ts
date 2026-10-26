import { App } from 'aws-cdk-lib';
import { DevopsContentMcpStack } from './stack';

const app = new App();
// `-c stage=dev` deploys a separate stack with dev- / dev_ prefixed names alongside prod.
const dev = app.node.tryGetContext('stage') === 'dev';

// `-c jwtDiscoveryUrl=... -c jwtAllowedClients=id1,id2` switches the runtime from IAM to JWT auth. The deploy
// workflow reads both from the KiroAgentGatewayStack outputs; omit them to keep IAM (SigV4).
const discoveryUrl = app.node.tryGetContext('jwtDiscoveryUrl') as string | undefined;
const allowedClients = ((app.node.tryGetContext('jwtAllowedClients') as string | undefined) ?? '')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

new DevopsContentMcpStack(app, `${dev ? 'dev-' : ''}DevopsContentMcpStack`, {
  runtimeNamePrefix: dev ? 'dev_' : '',
  jwtAuthorizer: discoveryUrl && allowedClients.length ? { discoveryUrl, allowedClients } : undefined,
});
