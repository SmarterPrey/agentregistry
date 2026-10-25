import { App } from 'aws-cdk-lib';
import { SkillsStack } from '../lib/stack';

const app = new App();
const prefix = app.node.tryGetContext('stage') === 'dev' ? 'dev-' : '';
new SkillsStack(app, `${prefix}SkillsStack`, { exportPrefix: prefix });
