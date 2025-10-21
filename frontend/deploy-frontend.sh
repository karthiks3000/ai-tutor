#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎓 AI Tutor Frontend Deployment Script${NC}"
echo ""

# Check parameters
if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment parameter required${NC}"
    echo "Usage: ./deploy-frontend.sh <environment> [--profile <aws-profile>]"
    exit 1
fi

ENVIRONMENT=$1
AWS_PROFILE_FLAG=""

if [ "$2" == "--profile" ] && [ -n "$3" ]; then
    AWS_PROFILE_FLAG="--profile $3"
    echo -e "${GREEN}✓ Using AWS profile: $3${NC}"
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Building React application...${NC}"
npm run build

# Get bucket name from CDK outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name TutorAgentStack-${ENVIRONMENT} \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text \
  $AWS_PROFILE_FLAG 2>/dev/null)

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Error: Could not determine S3 bucket name${NC}"
    exit 1
fi

echo -e "${YELLOW}☁️  Uploading to S3: ${BUCKET_NAME}${NC}"
aws s3 sync dist/ s3://${BUCKET_NAME}/ --delete $AWS_PROFILE_FLAG

# Get CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name TutorAgentStack-${ENVIRONMENT} \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  $AWS_PROFILE_FLAG 2>/dev/null)

if [ -n "$DIST_ID" ]; then
    echo -e "${YELLOW}♻️  Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
      --distribution-id ${DIST_ID} \
      --paths "/*" \
      $AWS_PROFILE_FLAG > /dev/null
fi

# Get frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name TutorAgentStack-${ENVIRONMENT} \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
  --output text \
  $AWS_PROFILE_FLAG 2>/dev/null)

echo ""
echo -e "${GREEN}✅ Frontend Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend URL: ${FRONTEND_URL}${NC}"
echo ""
