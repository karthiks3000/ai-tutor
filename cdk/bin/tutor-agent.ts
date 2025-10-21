#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TutorAgentStack } from '../lib/tutor-agent-stack';


const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

new TutorAgentStack(app, `TutorAgentStack-${environment}`, {
  environment: environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `AI Tutor infrastructure for middle school English learning - ${environment}`,
});

app.synth();
