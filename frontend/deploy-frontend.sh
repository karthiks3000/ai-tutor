#!/bin/bash

# Frontend Deployment Script for AI Tutor
# Builds and deploys frontend to S3 + CloudFront

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-dev}
AWS_PROFILE=${2:-bookhood}
STACK_NAME="TutorAgentStack-${ENVIRONMENT}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# AWS CLI with profile
AWS_CLI="aws --profile $AWS_PROFILE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        log_error "Frontend package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if .env.development exists
    if [ ! -f "$FRONTEND_DIR/.env.development" ]; then
        log_error ".env.development file not found in frontend directory."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Extract CDK outputs
extract_cdk_outputs() {
    log_info "Extracting CDK stack outputs..."
    
    # Check if stack exists
    if ! $AWS_CLI cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
        log_error "CDK stack '$STACK_NAME' not found. Please deploy the CDK stack first:"
        log_error "  cd cdk && cdk deploy $STACK_NAME --profile $AWS_PROFILE"
        exit 1
    fi
    
    # Extract outputs using AWS CLI
    OUTPUTS=$($AWS_CLI cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output json)
    
    # Parse outputs
    FRONTEND_BUCKET=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')
    DISTRIBUTION_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
    DISTRIBUTION_DOMAIN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionDomainName") | .OutputValue')
    COGNITO_USER_POOL_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolId") | .OutputValue')
    COGNITO_CLIENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolClientId") | .OutputValue')
    COGNITO_REGION=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoRegion") | .OutputValue')
    
    # Validate outputs
    if [ "$FRONTEND_BUCKET" = "null" ] || [ -z "$FRONTEND_BUCKET" ]; then
        log_error "Failed to extract frontend bucket name from CDK outputs"
        exit 1
    fi
    
    if [ "$DISTRIBUTION_ID" = "null" ] || [ -z "$DISTRIBUTION_ID" ]; then
        log_error "Failed to extract CloudFront distribution ID from CDK outputs"
        exit 1
    fi
    
    log_success "CDK outputs extracted successfully"
    log_info "Frontend Bucket: $FRONTEND_BUCKET"
    log_info "Distribution ID: $DISTRIBUTION_ID"
    log_info "Distribution Domain: $DISTRIBUTION_DOMAIN"
    log_info "Cognito User Pool ID: $COGNITO_USER_POOL_ID"
    log_info "Cognito Client ID: $COGNITO_CLIENT_ID"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Clean previous build to ensure fresh deployment
    if [ -d "dist" ]; then
        log_info "Removing previous build..."
        rm -rf dist
    fi
    
    # Sync .env.production from .env.development to ensure latest values
    log_info "Syncing environment configuration..."
    cp .env.development .env.production
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    # Build for production (will use .env.production)
    log_info "Running production build..."
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        log_error "Build failed - dist directory or index.html not found"
        exit 1
    fi
    
    log_success "Frontend build completed successfully"
}

# Deploy to S3
deploy_to_s3() {
    log_info "Deploying to S3 bucket: $FRONTEND_BUCKET..."
    
    cd "$FRONTEND_DIR"
    
    # Sync files to S3 with appropriate cache headers
    # Using --size-only to force comparison and ensure updates are detected
    # Static assets get long cache times
    $AWS_CLI s3 sync dist/ "s3://$FRONTEND_BUCKET" \
        --delete \
        --size-only \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js" \
        --exclude "manifest.json"
    
    # Upload HTML files and service worker with no-cache headers
    # Using --size-only to force comparison
    $AWS_CLI s3 sync dist/ "s3://$FRONTEND_BUCKET" \
        --size-only \
        --cache-control "public, max-age=0, must-revalidate" \
        --include "*.html" \
        --include "service-worker.js" \
        --include "manifest.json"
    
    log_success "Files deployed to S3 successfully"
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    log_info "Invalidating CloudFront cache..."
    
    INVALIDATION_ID=$($AWS_CLI cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    log_info "Invalidation created with ID: $INVALIDATION_ID"
    log_info "Waiting for invalidation to complete..."
    
    $AWS_CLI cloudfront wait invalidation-completed \
        --distribution-id "$DISTRIBUTION_ID" \
        --id "$INVALIDATION_ID"
    
    log_success "CloudFront cache invalidation completed"
}

# Main deployment function
main() {
    log_info "Starting frontend deployment for environment: $ENVIRONMENT"
    log_info "Using AWS profile: $AWS_PROFILE"
    log_info "Stack name: $STACK_NAME"
    echo
    
    check_prerequisites
    extract_cdk_outputs
    build_frontend
    deploy_to_s3
    invalidate_cloudfront
    
    echo
    log_success "Frontend deployment completed successfully!"
    log_info "Frontend URL: https://$DISTRIBUTION_DOMAIN"
    echo
    log_info "Next steps:"
    log_info "  1. Wait a few minutes for CloudFront to propagate changes"
    log_info "  2. Visit the frontend URL to verify deployment"
    log_info "  3. Check browser console for any configuration issues"
}

# Help function
show_help() {
    echo "Usage: $0 [ENVIRONMENT] [AWS_PROFILE]"
    echo
    echo "Deploy the AI Tutor frontend to AWS S3 + CloudFront"
    echo
    echo "Arguments:"
    echo "  ENVIRONMENT    Environment name (default: dev)"
    echo "  AWS_PROFILE    AWS CLI profile name (default: bookhood)"
    echo
    echo "Examples:"
    echo "  $0                    # Deploy to dev environment with bookhood profile"
    echo "  $0 dev                # Deploy to dev environment with bookhood profile"
    echo "  $0 dev myprofile      # Deploy to dev environment with myprofile"
    echo "  $0 staging bookhood   # Deploy to staging environment"
    echo
    echo "Prerequisites:"
    echo "  - AWS CLI configured with appropriate credentials"
    echo "  - CDK stack deployed: cd cdk && cdk deploy TutorAgentStack-ENVIRONMENT"
    echo "  - Node.js and npm installed"
    echo "  - jq installed for JSON parsing"
    echo "  - .env.development file in frontend directory"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install it first:"
    log_error "  macOS: brew install jq"
    log_error "  Ubuntu: sudo apt-get install jq"
    log_error "  CentOS: sudo yum install jq"
    exit 1
fi

# Run main function
main "$@"
