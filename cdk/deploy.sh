#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎓 AI Tutor CDK Deployment Script${NC}"
echo ""

# Check for required parameters
if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment parameter required${NC}"
    echo "Usage: ./deploy.sh <environment> [--profile <aws-profile>]"
    echo "Example: ./deploy.sh dev --profile bookhood"
    exit 1
fi

ENVIRONMENT=$1
AWS_PROFILE_FLAG=""

# Parse optional profile parameter
if [ "$2" == "--profile" ] && [ -n "$3" ]; then
    AWS_PROFILE_FLAG="--profile $3"
    echo -e "${GREEN}✓ Using AWS profile: $3${NC}"
fi

echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing CDK dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Build TypeScript
echo -e "${YELLOW}🔨 Building CDK project...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Bootstrap CDK (if needed)
echo -e "${YELLOW}🚀 Checking CDK bootstrap status...${NC}"
cdk bootstrap $AWS_PROFILE_FLAG --context environment=$ENVIRONMENT 2>/dev/null || {
    echo -e "${YELLOW}Note: CDK already bootstrapped or bootstrap not needed${NC}"
}
echo ""

# Deploy stack
echo -e "${YELLOW}☁️  Deploying TutorAgentStack-${ENVIRONMENT}...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"
echo ""

cdk deploy TutorAgentStack-${ENVIRONMENT} \
    $AWS_PROFILE_FLAG \
    --context environment=$ENVIRONMENT \
    --require-approval never \
    --outputs-file cdk-outputs-${ENVIRONMENT}.json

echo ""
echo -e "${GREEN}✅ CDK Deployment Complete!${NC}"
echo ""

# Display outputs
if [ -f "cdk-outputs-${ENVIRONMENT}.json" ]; then
    echo -e "${BLUE}📋 Stack Outputs:${NC}"
    cat cdk-outputs-${ENVIRONMENT}.json | jq -r 'to_entries[] | .value | to_entries[] | "  \(.key): \(.value)"'
    echo ""
fi

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Note the Cognito User Pool ID and Client ID above"
echo "2. Deploy the tutor_agent: cd ../agents/tutor_agent && ./deploy-tutor-agent.sh"
echo "3. Configure frontend with the agent endpoint"
echo "4. Deploy frontend: cd ../frontend && ./deploy-frontend.sh ${ENVIRONMENT}"
echo ""
