import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { CognitoStack } from './cognito-stack';

export interface TutorAgentStackProps extends cdk.StackProps {
  environment: string;
}

export class TutorAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TutorAgentStackProps) {
    super(scope, id, props);

    // Create Cognito authentication infrastructure
    const cognitoStack = new CognitoStack(this, 'CognitoStack', {
      environment: props.environment,
    });

    // ==================== DynamoDB Tables ====================

    // 1. Students Table - Student profiles and learning preferences
    const studentsTable = new dynamodb.Table(this, 'StudentsTable', {
      tableName: `tutor-students-${props.environment}`,
      partitionKey: {
        name: 'student_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev - use RETAIN in production
      timeToLiveAttribute: 'ttl', // Optional: for data cleanup
    });

    // 2. Lesson Progress Table - Track lesson completions and performance
    const lessonProgressTable = new dynamodb.Table(this, 'LessonProgressTable', {
      tableName: `tutor-lesson-progress-${props.environment}`,
      partitionKey: {
        name: 'progress_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by student_id
    lessonProgressTable.addGlobalSecondaryIndex({
      indexName: 'student-index',
      partitionKey: {
        name: 'student_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // 3. Quiz Results Table - Quiz scores and question-by-question analysis
    const quizResultsTable = new dynamodb.Table(this, 'QuizResultsTable', {
      tableName: `tutor-quiz-results-${props.environment}`,
      partitionKey: {
        name: 'quiz_result_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by student_id
    quizResultsTable.addGlobalSecondaryIndex({
      indexName: 'student-index',
      partitionKey: {
        name: 'student_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // 4. Achievements Table - Badges, XP history, unlocked content
    const achievementsTable = new dynamodb.Table(this, 'AchievementsTable', {
      tableName: `tutor-achievements-${props.environment}`,
      partitionKey: {
        name: 'achievement_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by student_id
    achievementsTable.addGlobalSecondaryIndex({
      indexName: 'student-index',
      partitionKey: {
        name: 'student_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'unlocked_at',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // ==================== S3 Buckets ====================

    // Frontend hosting bucket
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `tutor-frontend-${props.environment}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // ==================== CloudFront Distribution ====================

    // Create Origin Access Identity for secure S3 access
    const oai = new cloudfront.OriginAccessIdentity(this, 'FrontendOAI', {
      comment: `OAI for AI Tutor Frontend - ${props.environment}`,
    });

    // Grant the OAI read access to the S3 bucket
    frontendBucket.grantRead(oai);

    // Create S3 Origin for CloudFront
    const s3Origin = new origins.S3Origin(frontendBucket, {
      originAccessIdentity: oai,
    });

    // Create CloudFront Distribution for frontend hosting
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      comment: `AI Tutor Frontend Distribution - ${props.environment}`,
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      // Additional behaviors for static assets with longer caching
      additionalBehaviors: {
        '/assets/*': {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
      },
      defaultRootObject: 'index.html',
      // Error responses for SPA routing
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
    });

    // ==================== IAM Role for AgentCore Runtime ====================

    // Create IAM role for the tutor agent with least-privilege permissions
    const agentExecutionRole = new iam.Role(this, 'TutorAgentExecutionRoleV2', {
      roleName: `TutorAgentExecRole-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      description: `Execution role for AI Tutor AgentCore runtime - ${props.environment}`,
    });

    // Add inline policy with all necessary permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'BedrockModelInvocation',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:Converse',
        'bedrock:ConverseStream',
      ],
      resources: [
        `arn:aws:bedrock:*::foundation-model/*`,
        `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        `arn:aws:bedrock:${this.region}::foundation-model/*`,
      ],
    }));

    // Add ECR permissions for container image access
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ECRImageAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:GetAuthorizationToken',
      ],
      resources: ['*'],
    }));

    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ECRRepositoryAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:BatchGetImage',
        'ecr:GetDownloadUrlForLayer',
      ],
      resources: [
        `arn:aws:ecr:${this.region}:${this.account}:repository/*`,
      ],
    }));

    // Grant DynamoDB access to all tutor tables
    studentsTable.grantReadWriteData(agentExecutionRole);
    lessonProgressTable.grantReadWriteData(agentExecutionRole);
    quizResultsTable.grantReadWriteData(agentExecutionRole);
    achievementsTable.grantReadWriteData(agentExecutionRole);

    // Add Parameter Store access
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ParameterStoreAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
      ],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/tutor-agent/*`,
      ],
    }));

    // Add CloudWatch Logs permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'CloudWatchLogs',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
      ],
      resources: [
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
      ],
    }));

    // Add AgentCore Memory permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreMemory',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:CreateMemory',
        'bedrock-agentcore:GetMemory',
        'bedrock-agentcore:CreateEvent',
        'bedrock-agentcore:GetEvent',
        'bedrock-agentcore:ListEvents',
        'bedrock-agentcore:ListMemoryRecords',
        'bedrock-agentcore:RetrieveMemoryRecords',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:memory/*`,
      ],
    }));

    // Add AgentCore Runtime permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreRuntime',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:InvokeAgentRuntime',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:runtime/*`,
      ],
    }));

    // Add X-Ray tracing permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'XRayTracing',
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
        'xray:GetSamplingRules',
        'xray:GetSamplingTargets',
      ],
      resources: ['*'],
    }));

    // Add CloudWatch Metrics permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'CloudWatchMetrics',
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
      ],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'cloudwatch:namespace': 'bedrock-agentcore',
        },
      },
    }));

    // Add AWS Marketplace permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'MarketplaceAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'aws-marketplace:ViewSubscriptions',
      ],
      resources: ['*'],
    }));

    // Add Guardrail support for Bedrock
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'BedrockGuardrails',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:ApplyGuardrail',
      ],
      resources: [
        `arn:aws:bedrock:${this.region}:${this.account}:*`,
      ],
    }));

    // Add AgentCore Identity permissions for token management
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreIdentityApiKey',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:GetResourceApiKey',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:token-vault/default`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:token-vault/default/apikeycredentialprovider/*`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default/workload-identity/tutor_agent-*`,
      ],
    }));

    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreIdentityOAuth',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:GetResourceOauth2Token',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:token-vault/default`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:token-vault/default/oauth2credentialprovider/*`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default/workload-identity/tutor_agent-*`,
      ],
    }));

    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreIdentityWorkload',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:GetWorkloadAccessToken',
        'bedrock-agentcore:GetWorkloadAccessTokenForJWT',
        'bedrock-agentcore:GetWorkloadAccessTokenForUserId',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default`,
        `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default/workload-identity/tutor_agent-*`,
      ],
    }));

    // Add AgentCore Browser tools permissions
    agentExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreBrowserTools',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:CreateBrowser',
        'bedrock-agentcore:ListBrowsers',
        'bedrock-agentcore:GetBrowser',
        'bedrock-agentcore:DeleteBrowser',
        'bedrock-agentcore:StartBrowserSession',
        'bedrock-agentcore:ListBrowserSessions',
        'bedrock-agentcore:GetBrowserSession',
        'bedrock-agentcore:StopBrowserSession',
        'bedrock-agentcore:UpdateBrowserStream',
        'bedrock-agentcore:ConnectBrowserAutomationStream',
        'bedrock-agentcore:ConnectBrowserLiveViewStream',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${this.region}:aws:browser/*`,
      ],
    }));

    // ==================== SSM Parameters ====================

    // Store IAM role ARN
    new ssm.StringParameter(this, 'AgentExecutionRoleArnParam', {
      parameterName: `/tutor-agent/${props.environment}/execution-role-arn`,
      stringValue: agentExecutionRole.roleArn,
      description: 'IAM Role ARN for Tutor Agent execution',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store Cognito configuration for JWT authentication
    new ssm.StringParameter(this, 'CognitoUserPoolIdParam', {
      parameterName: `/tutor-agent/${props.environment}/cognito-user-pool-id`,
      stringValue: cognitoStack.userPool.userPoolId,
      description: 'Cognito User Pool ID for JWT authentication',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'CognitoClientIdParam', {
      parameterName: `/tutor-agent/${props.environment}/cognito-client-id`,
      stringValue: cognitoStack.userPoolClient.userPoolClientId,
      description: 'Cognito Client ID for JWT authentication',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store Cognito discovery URL for JWT validation
    const discoveryUrl = `https://cognito-idp.${this.region}.amazonaws.com/${cognitoStack.userPool.userPoolId}/.well-known/openid-configuration`;
    new ssm.StringParameter(this, 'CognitoDiscoveryUrlParam', {
      parameterName: `/tutor-agent/${props.environment}/cognito-discovery-url`,
      stringValue: discoveryUrl,
      description: 'Cognito OIDC discovery URL for JWT validation',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store DynamoDB table names
    new ssm.StringParameter(this, 'StudentsTableParam', {
      parameterName: `/tutor-agent/${props.environment}/dynamodb-students-table`,
      stringValue: studentsTable.tableName,
      description: 'DynamoDB Students table name',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'LessonProgressTableParam', {
      parameterName: `/tutor-agent/${props.environment}/dynamodb-progress-table`,
      stringValue: lessonProgressTable.tableName,
      description: 'DynamoDB Lesson Progress table name',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'QuizResultsTableParam', {
      parameterName: `/tutor-agent/${props.environment}/dynamodb-quiz-table`,
      stringValue: quizResultsTable.tableName,
      description: 'DynamoDB Quiz Results table name',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'AchievementsTableParam', {
      parameterName: `/tutor-agent/${props.environment}/dynamodb-achievements-table`,
      stringValue: achievementsTable.tableName,
      description: 'DynamoDB Achievements table name',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store AWS region
    new ssm.StringParameter(this, 'AwsRegionParam', {
      parameterName: `/tutor-agent/${props.environment}/aws-region`,
      stringValue: this.region,
      description: 'AWS Region for the tutor agent',
      tier: ssm.ParameterTier.STANDARD,
    });

    // ==================== Outputs ====================

    // Cognito outputs
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: cognitoStack.userPool.userPoolId,
      description: 'Cognito User Pool ID for frontend configuration',
      exportName: `TutorAgent-${props.environment}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: cognitoStack.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for frontend configuration',
      exportName: `TutorAgent-${props.environment}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
      description: 'AWS Region for Cognito configuration',
      exportName: `TutorAgent-${props.environment}-Region`,
    });

    // DynamoDB table outputs
    new cdk.CfnOutput(this, 'StudentsTableName', {
      value: studentsTable.tableName,
      description: 'DynamoDB Students table name',
      exportName: `TutorAgent-${props.environment}-StudentsTable`,
    });

    new cdk.CfnOutput(this, 'LessonProgressTableName', {
      value: lessonProgressTable.tableName,
      description: 'DynamoDB Lesson Progress table name',
      exportName: `TutorAgent-${props.environment}-LessonProgressTable`,
    });

    new cdk.CfnOutput(this, 'QuizResultsTableName', {
      value: quizResultsTable.tableName,
      description: 'DynamoDB Quiz Results table name',
      exportName: `TutorAgent-${props.environment}-QuizResultsTable`,
    });

    new cdk.CfnOutput(this, 'AchievementsTableName', {
      value: achievementsTable.tableName,
      description: 'DynamoDB Achievements table name',
      exportName: `TutorAgent-${props.environment}-AchievementsTable`,
    });

    // Frontend hosting outputs
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket name for frontend hosting',
      exportName: `TutorAgent-${props.environment}-FrontendBucket`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID for cache invalidation',
      exportName: `TutorAgent-${props.environment}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution domain name for frontend access',
      exportName: `TutorAgent-${props.environment}-DistributionDomain`,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Frontend application URL',
      exportName: `TutorAgent-${props.environment}-FrontendUrl`,
    });

    // Agent infrastructure outputs
    new cdk.CfnOutput(this, 'AgentExecutionRoleArn', {
      value: agentExecutionRole.roleArn,
      description: 'IAM Role ARN for Tutor Agent execution',
      exportName: `TutorAgent-${props.environment}-ExecutionRoleArn`,
    });

    new cdk.CfnOutput(this, 'CognitoDiscoveryUrl', {
      value: discoveryUrl,
      description: 'Cognito OIDC discovery URL for JWT validation',
      exportName: `TutorAgent-${props.environment}-DiscoveryUrl`,
    });
  }
}
