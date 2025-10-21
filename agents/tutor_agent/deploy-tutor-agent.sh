#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎓 AI Tutor Agent Deployment Script${NC}"
echo ""

# Parse parameters
ENVIRONMENT="dev"
AWS_PROFILE_FLAG=""

# Check if first parameter is --profile
if [ "$1" == "--profile" ] && [ -n "$2" ]; then
    AWS_PROFILE_FLAG="--profile $2"
    export AWS_PROFILE=$2
    echo -e "${GREEN}✓ Using AWS profile: $2${NC}"
    # If there's a third parameter, use it as environment
    if [ -n "$3" ]; then
        ENVIRONMENT=$3
    fi
else
    # First parameter is environment (or use default)
    ENVIRONMENT=${1:-dev}
    # Check if second and third parameters are profile
    if [ "$2" == "--profile" ] && [ -n "$3" ]; then
        AWS_PROFILE_FLAG="--profile $3"
        export AWS_PROFILE=$3
        echo -e "${GREEN}✓ Using AWS profile: $3${NC}"
    fi
fi

echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check for required tools
command -v agentcore >/dev/null 2>&1 || {
    echo -e "${RED}Error: agentcore CLI not found${NC}"
    echo "Install with: pip install bedrock-agentcore"
    exit 1
}

command -v aws >/dev/null 2>&1 || {
    echo -e "${RED}Error: AWS CLI not found${NC}"
    exit 1
}

# Get AWS region
REGION=$(aws configure get region $AWS_PROFILE_FLAG 2>/dev/null || echo "us-east-1")
echo -e "${GREEN}✓ AWS Region: ${REGION}${NC}"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text $AWS_PROFILE_FLAG)

echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt -q

echo ""
echo -e "${YELLOW}📋 Reading infrastructure configuration from Parameter Store...${NC}"

# Try to read from Parameter Store first (created by CDK)
EXECUTION_ROLE_ARN=$(aws ssm get-parameter \
    --name "/tutor-agent/${ENVIRONMENT}/execution-role-arn" \
    --query 'Parameter.Value' \
    --output text \
    $AWS_PROFILE_FLAG 2>/dev/null || echo "")

DISCOVERY_URL=$(aws ssm get-parameter \
    --name "/tutor-agent/${ENVIRONMENT}/cognito-discovery-url" \
    --query 'Parameter.Value' \
    --output text \
    $AWS_PROFILE_FLAG 2>/dev/null || echo "")

USER_POOL_CLIENT_ID=$(aws ssm get-parameter \
    --name "/tutor-agent/${ENVIRONMENT}/cognito-client-id" \
    --query 'Parameter.Value' \
    --output text \
    $AWS_PROFILE_FLAG 2>/dev/null || echo "")

# Check if the IAM role actually exists (SSM might be stale)
ROLE_EXISTS=false
if [ -n "$EXECUTION_ROLE_ARN" ]; then
    IAM_ROLE_NAME=$(echo "$EXECUTION_ROLE_ARN" | awk -F'/' '{print $NF}')
    if aws iam get-role --role-name "$IAM_ROLE_NAME" $AWS_PROFILE_FLAG >/dev/null 2>&1; then
        ROLE_EXISTS=true
        echo -e "${GREEN}✓ Found existing IAM role: ${IAM_ROLE_NAME}${NC}"
    else
        echo -e "${YELLOW}⚠️  SSM parameter exists but IAM role was deleted${NC}"
        EXECUTION_ROLE_ARN=""
    fi
fi

# If role doesn't exist, create it automatically
if [ "$ROLE_EXISTS" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Execution role not found in Parameter Store${NC}"
    echo -e "${YELLOW}📝 Creating IAM execution role automatically...${NC}"
    
    IAM_ROLE_NAME="TutorAgentExecRole-${ENVIRONMENT}"
    
    # Define trust policy
    IAM_TRUST_POLICY='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock-agentcore.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'
    
    # Define comprehensive permissions policy
    IAM_ROLE_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECRImageAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer"
            ],
            "Resource": [
                "arn:aws:ecr:${REGION}:${ACCOUNT_ID}:repository/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:DescribeLogStreams",
                "logs:CreateLogGroup"
            ],
            "Resource": [
                "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/bedrock-agentcore/runtimes/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:DescribeLogGroups"
            ],
            "Resource": [
                "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*"
            ]
        },
        {
            "Sid": "ECRTokenAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
                "xray:GetSamplingRules",
                "xray:GetSamplingTargets"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Resource": "*",
            "Action": "cloudwatch:PutMetricData",
            "Condition": {
                "StringEquals": {
                    "cloudwatch:namespace": "bedrock-agentcore"
                }
            }
        },
        {
            "Sid": "BedrockAgentCoreMemory",
            "Effect": "Allow",
            "Action": [
                "bedrock-agentcore:CreateEvent",
                "bedrock-agentcore:GetEvent",
                "bedrock-agentcore:GetMemory",
                "bedrock-agentcore:GetMemoryRecord",
                "bedrock-agentcore:ListActors",
                "bedrock-agentcore:ListEvents",
                "bedrock-agentcore:ListMemoryRecords",
                "bedrock-agentcore:ListMemories",
                "bedrock-agentcore:ListSessions",
                "bedrock-agentcore:DeleteEvent",
                "bedrock-agentcore:DeleteMemoryRecord",
                "bedrock-agentcore:RetrieveMemoryRecords",
                "bedrock-agentcore:CreateMemory"
            ],
            "Resource": [
                "arn:aws:bedrock-agentcore:${REGION}:${ACCOUNT_ID}:memory/*"
            ]
        },
        {
            "Sid": "BedrockModelInvocation",
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:Converse",
                "bedrock:ConverseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/*",
                "arn:aws:bedrock:${REGION}:${ACCOUNT_ID}:inference-profile/*",
                "arn:aws:bedrock:${REGION}::foundation-model/*"
            ]
        }
    ]
}
EOF
)
    
    # Create IAM role (ignore error if already exists)
    echo -e "${YELLOW}Creating IAM role: ${IAM_ROLE_NAME}${NC}"
    aws iam create-role \
        --role-name $IAM_ROLE_NAME \
        --assume-role-policy-document "$IAM_TRUST_POLICY" \
        $AWS_PROFILE_FLAG >/dev/null 2>&1 || echo -e "${YELLOW}  (Role may already exist)${NC}"
    
    # Attach the policy to the role
    echo -e "${YELLOW}Attaching execution policy...${NC}"
    aws iam put-role-policy \
        --role-name $IAM_ROLE_NAME \
        --policy-name "TutorAgentExecutionPolicy" \
        --policy-document "$IAM_ROLE_POLICY" \
        $AWS_PROFILE_FLAG >/dev/null 2>&1
    
    # Construct the role ARN
    EXECUTION_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${IAM_ROLE_NAME}"
    
    echo -e "${GREEN}✓ IAM role created: ${IAM_ROLE_NAME}${NC}"
    echo -e "${GREEN}✓ Role ARN: ${EXECUTION_ROLE_ARN}${NC}"
    
    # Wait for IAM role to propagate
    echo -e "${YELLOW}⏳ Waiting for IAM role to propagate (10s)...${NC}"
    sleep 10
fi

# If Cognito config still missing, provide helpful message
if [ -z "$DISCOVERY_URL" ] || [ -z "$USER_POOL_CLIENT_ID" ]; then
    echo -e "${RED}Error: Cognito configuration not found in Parameter Store${NC}"
    echo "Make sure CDK stack is deployed: cd ../../cdk && ./deploy.sh ${ENVIRONMENT}"
    exit 1
fi

echo -e "${GREEN}✓ Execution Role: ${EXECUTION_ROLE_ARN}${NC}"
echo -e "${GREEN}✓ Discovery URL: ${DISCOVERY_URL}${NC}"
echo -e "${GREEN}✓ Client ID: ${USER_POOL_CLIENT_ID}${NC}"

echo ""
echo -e "${YELLOW}⚙️  Configuring AgentCore agent...${NC}"

# Configure the agent with JWT authentication
agentcore configure \
    --entrypoint tutor_agent.py \
    --name tutor_agent \
    --execution-role "$EXECUTION_ROLE_ARN" \
    --requirements-file requirements.txt \
    --region "$REGION" \
    --authorizer-config "{
        \"customJWTAuthorizer\": {
            \"discoveryUrl\": \"$DISCOVERY_URL\",
            \"allowedClients\": [\"$USER_POOL_CLIENT_ID\"]
        }
    }"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: AgentCore configuration failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Agent configured successfully${NC}"
echo ""
echo -e "${YELLOW}🚀 Deploying tutor-agent to AgentCore Runtime...${NC}"
echo ""

# Set Bedrock model ID (default to Nova Pro)
BEDROCK_MODEL_ID="${BEDROCK_MODEL_ID:-us.amazon.nova-pro-v1:0}"
echo -e "${BLUE}Bedrock Model: ${BEDROCK_MODEL_ID}${NC}"
echo -e "${BLUE}Note: Memory will be auto-configured by AgentCore (BEDROCK_AGENTCORE_MEMORY_ID)${NC}"

# Launch (deploy) the agent with model ID environment variable
# AgentCore will automatically set BEDROCK_AGENTCORE_MEMORY_ID when memory is configured
agentcore launch --env BEDROCK_MODEL_ID="${BEDROCK_MODEL_ID}"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Agent deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Agent Deployment Complete!${NC}"
echo ""

# Display agent endpoint
echo -e "${YELLOW}📍 Agent Endpoint${NC}"
echo -e "${BLUE}Run 'agentcore status' to view the agent endpoint${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment Summary${NC}"
echo -e "${GREEN}=====================${NC}"
echo -e "✅ Agent configured with JWT authentication"
echo -e "✅ Agent deployed to AgentCore runtime"
echo -e "✅ Infrastructure managed by CDK"
echo -e "✅ Least-privilege IAM permissions applied"
echo ""
echo -e "${BLUE}Agent Details:${NC}"
echo -e "  Name: tutor_agent"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Region: ${REGION}"
echo -e "  Endpoint: ${AGENT_ENDPOINT:-'Run agentcore status to retrieve'}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test the agent:"
echo "   ${YELLOW}agentcore invoke --prompt 'Start a learning session for grade 7'${NC}"
echo ""
echo "2. Configure frontend with agent endpoint:"
echo "   ${YELLOW}Update frontend/.env with VITE_AGENT_CORE_URL=${AGENT_ENDPOINT}${NC}"
echo ""
echo "3. Deploy frontend:"
echo "   ${YELLOW}cd ../../frontend && ./deploy-frontend.sh ${ENVIRONMENT}${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  • Check status: ${YELLOW}agentcore status${NC}"
echo "  • View logs: ${YELLOW}agentcore logs${NC}"
echo "  • Update agent: ${YELLOW}agentcore launch${NC}"
echo "  • Delete agent: ${YELLOW}agentcore destroy${NC}"
echo ""
