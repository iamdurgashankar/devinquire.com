#!/bin/bash

# DevInquire Dashboard - Production Deployment Script
# Deploys the complete Firebase backend to production with safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
FUNCTIONS_DIR="$PROJECT_ROOT/firebase/functions"
ENV_FILE="$PROJECT_ROOT/.env.production"
FIREBASE_RC="$PROJECT_ROOT/.firebaserc"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"

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

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Safety confirmation
confirm_production_deploy() {
    print_header "Production Deployment Confirmation"
    
    # Get current Firebase project
    if [ -f "$FIREBASE_RC" ]; then
        PROJECT_ID=$(cat "$FIREBASE_RC" | grep -o '"default"[^}]*' | cut -d'"' -f4)
        log_warning "You are about to deploy to production project: $PROJECT_ID"
    else
        log_error "No Firebase project configured. Run: firebase use --add"
        exit 1
    fi
    
    echo -e "\n${RED}WARNING: This will deploy to PRODUCTION environment!${NC}"
    echo "This action will:"
    echo "  - Deploy Cloud Functions to production"
    echo "  - Update Firestore security rules"
    echo "  - Update Firebase Storage rules"
    echo "  - Deploy frontend to Firebase Hosting"
    echo ""
    
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    log_success "Production deployment confirmed"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js version $NODE_VERSION is not compatible. Required: $REQUIRED_VERSION or higher"
        exit 1
    fi
    
    log_success "Node.js version $NODE_VERSION is compatible"
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI is not installed. Install with: npm install -g firebase-tools"
        exit 1
    fi
    
    # Check Firebase CLI version
    FIREBASE_VERSION=$(firebase --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    log_success "Firebase CLI version $FIREBASE_VERSION is installed"
    
    # Check if logged in to Firebase
    if ! firebase projects:list &> /dev/null; then
        log_error "Not logged in to Firebase. Run: firebase login"
        exit 1
    fi
    
    log_success "Firebase authentication verified"
    
    # Check Git status
    if command -v git &> /dev/null && [ -d ".git" ]; then
        if [ -n "$(git status --porcelain)" ]; then
            log_warning "Working directory has uncommitted changes"
            git status --short
            echo ""
            read -p "Continue with uncommitted changes? (y/N): " -r
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deployment cancelled. Please commit your changes first."
                exit 0
            fi
        else
            log_success "Working directory is clean"
        fi
        
        # Get current branch and commit
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        CURRENT_COMMIT=$(git rev-parse --short HEAD)
        log_info "Deploying from branch: $CURRENT_BRANCH (commit: $CURRENT_COMMIT)"
    fi
}

# Setup production environment
setup_environment() {
    print_header "Setting Up Production Environment"
    
    cd "$PROJECT_ROOT"
    
    # Check for production environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file not found: $ENV_FILE"
        log_info "Please create the production environment file with proper configuration"
        exit 1
    fi
    
    log_success "Production environment file found: $ENV_FILE"
    
    # Validate required environment variables
    source "$ENV_FILE"
    
    REQUIRED_VARS=("REACT_APP_FIREBASE_API_KEY" "REACT_APP_FIREBASE_AUTH_DOMAIN" "REACT_APP_FIREBASE_PROJECT_ID")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set in $ENV_FILE"
            exit 1
        fi
    done
    
    log_success "Required environment variables are configured"
    
    # Validate Firebase project configuration
    if [ -f "$FIREBASE_RC" ]; then
        PROJECT_ID=$(cat "$FIREBASE_RC" | grep -o '"default"[^}]*' | cut -d'"' -f4)
        if [ "$PROJECT_ID" != "$REACT_APP_FIREBASE_PROJECT_ID" ]; then
            log_error "Firebase project ID mismatch:"
            log_error "  .firebaserc: $PROJECT_ID"
            log_error "  Environment: $REACT_APP_FIREBASE_PROJECT_ID"
            exit 1
        fi
        log_success "Firebase project configuration validated: $PROJECT_ID"
    else
        log_error "Firebase project not configured. Run: firebase use --add"
        exit 1
    fi
}

# Create backup
create_backup() {
    print_header "Creating Backup"
    
    mkdir -p "$BACKUP_DIR"
    
    cd "$PROJECT_ROOT"
    
    # Backup current deployment info
    if command -v firebase &> /dev/null; then
        log_info "Backing up current Firebase configuration..."
        
        # Export Firestore data
        if firebase firestore:export "$BACKUP_DIR/firestore" --project "$PROJECT_ID" 2>/dev/null; then
            log_success "Firestore data backed up"
        else
            log_warning "Could not backup Firestore data (may not exist yet)"
        fi
        
        # Backup security rules
        if [ -f "firestore.rules" ]; then
            cp firestore.rules "$BACKUP_DIR/firestore.rules"
            log_success "Firestore rules backed up"
        fi
        
        if [ -f "storage.rules" ]; then
            cp storage.rules "$BACKUP_DIR/storage.rules"
            log_success "Storage rules backed up"
        fi
        
        # Backup current functions if they exist
        if [ -d "$FUNCTIONS_DIR/lib" ]; then
            cp -r "$FUNCTIONS_DIR/lib" "$BACKUP_DIR/functions-lib"
            log_success "Current functions backed up"
        fi
    fi
    
    log_success "Backup created at: $BACKUP_DIR"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    cd "$PROJECT_ROOT"
    
    log_info "Installing frontend dependencies..."
    npm ci --production=false
    log_success "Frontend dependencies installed"
    
    if [ -d "$FUNCTIONS_DIR" ]; then
        log_info "Installing Cloud Functions dependencies..."
        cd "$FUNCTIONS_DIR"
        npm ci --production=false
        log_success "Cloud Functions dependencies installed"
        cd "$PROJECT_ROOT"
    fi
}

# Run comprehensive tests
run_tests() {
    print_header "Running Comprehensive Tests"
    
    cd "$PROJECT_ROOT"
    
    # Test Firebase configuration
    if [ -f "scripts/test-firebase-config.js" ]; then
        log_info "Testing Firebase configuration..."
        node scripts/test-firebase-config.js
        log_success "Firebase configuration test passed"
    fi
    
    # Run frontend tests
    log_info "Running frontend tests..."
    if ! npm test -- --watchAll=false --coverage --passWithNoTests; then
        log_error "Frontend tests failed"
        exit 1
    fi
    log_success "Frontend tests passed"
    
    # Run functions tests
    if [ -d "$FUNCTIONS_DIR" ] && [ -f "$FUNCTIONS_DIR/package.json" ]; then
        cd "$FUNCTIONS_DIR"
        if grep -q '"test"' package.json; then
            log_info "Running Cloud Functions tests..."
            if ! npm test; then
                log_error "Cloud Functions tests failed"
                exit 1
            fi
            log_success "Cloud Functions tests passed"
        fi
        cd "$PROJECT_ROOT"
    fi
    
    # Security audit
    log_info "Running security audit..."
    if npm audit --audit-level=high; then
        log_success "Security audit passed"
    else
        log_warning "Security audit found issues. Please review before deploying."
        read -p "Continue with security issues? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled due to security issues"
            exit 1
        fi
    fi
}

# Build for production
build_production() {
    print_header "Building for Production"
    
    cd "$PROJECT_ROOT"
    
    # Set production environment
    export NODE_ENV=production
    
    # Build Cloud Functions
    if [ -d "$FUNCTIONS_DIR" ]; then
        cd "$FUNCTIONS_DIR"
        
        log_info "Linting Cloud Functions..."
        if ! npm run lint; then
            log_error "Cloud Functions linting failed"
            exit 1
        fi
        
        log_info "Building Cloud Functions..."
        npm run build
        log_success "Cloud Functions built successfully"
        
        cd "$PROJECT_ROOT"
    fi
    
    # Build frontend
    log_info "Building frontend application..."
    npm run build
    log_success "Frontend application built successfully"
    
    # Verify build
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        log_success "Build directory created (size: $BUILD_SIZE)"
        
        # Check for critical files
        if [ ! -f "build/index.html" ]; then
            log_error "Build verification failed: index.html not found"
            exit 1
        fi
        
        if [ ! -d "build/static" ]; then
            log_error "Build verification failed: static assets not found"
            exit 1
        fi
        
        log_success "Build verification passed"
    else
        log_error "Build directory not found"
        exit 1
    fi
}

# Deploy to Firebase
deploy_to_firebase() {
    print_header "Deploying to Firebase Production"
    
    cd "$PROJECT_ROOT"
    
    # Deploy in stages for better error handling
    
    # 1. Deploy security rules first
    log_info "Deploying Firestore security rules..."
    if ! firebase deploy --only firestore:rules; then
        log_error "Failed to deploy Firestore rules"
        exit 1
    fi
    log_success "Firestore rules deployed"
    
    log_info "Deploying Storage security rules..."
    if ! firebase deploy --only storage:rules; then
        log_error "Failed to deploy Storage rules"
        exit 1
    fi
    log_success "Storage rules deployed"
    
    # 2. Deploy Cloud Functions
    if [ -d "$FUNCTIONS_DIR" ]; then
        log_info "Deploying Cloud Functions..."
        if ! firebase deploy --only functions; then
            log_error "Failed to deploy Cloud Functions"
            exit 1
        fi
        log_success "Cloud Functions deployed"
    fi
    
    # 3. Deploy hosting
    log_info "Deploying to Firebase Hosting..."
    if ! firebase deploy --only hosting; then
        log_error "Failed to deploy to Firebase Hosting"
        exit 1
    fi
    log_success "Firebase Hosting deployed"
    
    # Get deployment info
    PROJECT_ID=$(cat "$FIREBASE_RC" | grep -o '"default"[^}]*' | cut -d'"' -f4)
    HOSTING_URL="https://$PROJECT_ID.web.app"
    
    log_success "Deployment completed successfully!"
    echo -e "\n${GREEN}Deployment Summary:${NC}"
    echo "  Project ID: $PROJECT_ID"
    echo "  Hosting URL: $HOSTING_URL"
    echo "  Backup Location: $BACKUP_DIR"
    
    if command -v git &> /dev/null && [ -d ".git" ]; then
        echo "  Git Commit: $(git rev-parse --short HEAD)"
        echo "  Git Branch: $(git rev-parse --abbrev-ref HEAD)"
    fi
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "  1. Test the deployed application: $HOSTING_URL"
    echo "  2. Monitor Cloud Functions logs: firebase functions:log"
    echo "  3. Check Firebase Console for any issues"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    PROJECT_ID=$(cat "$FIREBASE_RC" | grep -o '"default"[^}]*' | cut -d'"' -f4)
    HOSTING_URL="https://$PROJECT_ID.web.app"
    
    log_info "Verifying hosting deployment..."
    
    # Simple HTTP check
    if command -v curl &> /dev/null; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOSTING_URL" || echo "000")
        
        if [ "$HTTP_STATUS" = "200" ]; then
            log_success "Hosting is responding (HTTP $HTTP_STATUS)"
        else
            log_warning "Hosting returned HTTP $HTTP_STATUS"
        fi
    else
        log_info "curl not available, skipping HTTP verification"
    fi
    
    # Check functions deployment
    if [ -d "$FUNCTIONS_DIR" ]; then
        log_info "Verifying Cloud Functions deployment..."
        if firebase functions:list --json > /dev/null 2>&1; then
            log_success "Cloud Functions are deployed and accessible"
        else
            log_warning "Could not verify Cloud Functions deployment"
        fi
    fi
    
    log_success "Deployment verification completed"
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                DevInquire Dashboard                          ║"
    echo "║              Production Deployment Script                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    # Parse command line arguments
    COMMAND=${1:-"full"}
    SKIP_CONFIRMATION=${2:-"false"}
    
    case $COMMAND in
        "prereq")
            check_prerequisites
            ;;
        "env")
            setup_environment
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_production
            ;;
        "deploy")
            if [ "$SKIP_CONFIRMATION" != "--yes" ]; then
                confirm_production_deploy
            fi
            deploy_to_firebase
            verify_deployment
            ;;
        "verify")
            verify_deployment
            ;;
        "full")
            if [ "$SKIP_CONFIRMATION" != "--yes" ]; then
                confirm_production_deploy
            fi
            check_prerequisites
            setup_environment
            create_backup
            install_dependencies
            run_tests
            build_production
            deploy_to_firebase
            verify_deployment
            ;;
        *)
            echo "Usage: $0 [command] [--yes]"
            echo "Commands:"
            echo "  prereq  - Check prerequisites only"
            echo "  env     - Setup environment only"
            echo "  test    - Run tests only"
            echo "  build   - Build for production only"
            echo "  deploy  - Deploy to Firebase only"
            echo "  verify  - Verify deployment only"
            echo "  full    - Complete production deployment (default)"
            echo ""
            echo "Options:"
            echo "  --yes   - Skip confirmation prompts (use with caution)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"