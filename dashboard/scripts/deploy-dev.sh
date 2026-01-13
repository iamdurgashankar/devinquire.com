#!/bin/bash

# DevInquire Dashboard - Development Deployment Script
# Sets up and deploys the complete Firebase backend for local development

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
ENV_FILE="$PROJECT_ROOT/.env.local"
FIREBASE_RC="$PROJECT_ROOT/.firebaserc"

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
        log_warning "Node.js version $NODE_VERSION detected. Recommended: $REQUIRED_VERSION or higher"
    else
        log_success "Node.js version $NODE_VERSION is compatible"
    fi
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI is not installed. Install with: npm install -g firebase-tools"
        exit 1
    fi
    
    log_success "Firebase CLI is installed"
    
    # Check if logged in to Firebase
    if ! firebase projects:list &> /dev/null; then
        log_error "Not logged in to Firebase. Run: firebase login"
        exit 1
    fi
    
    log_success "Firebase authentication verified"
}

# Setup environment
setup_environment() {
    print_header "Setting Up Development Environment"
    
    cd "$PROJECT_ROOT"
    
    # Check for environment file
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.example" ]; then
            log_info "Creating .env.local from .env.example"
            cp .env.example "$ENV_FILE"
            log_warning "Please configure your Firebase settings in $ENV_FILE"
        else
            log_error "No environment configuration found. Please create $ENV_FILE"
            exit 1
        fi
    else
        log_success "Environment file found: $ENV_FILE"
    fi
    
    # Check Firebase project configuration
    if [ ! -f "$FIREBASE_RC" ]; then
        log_warning "Firebase project not configured. Run: firebase use --add"
    else
        PROJECT_ID=$(cat "$FIREBASE_RC" | grep -o '"default"[^}]*' | cut -d'"' -f4)
        log_success "Firebase project configured: $PROJECT_ID"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    cd "$PROJECT_ROOT"
    
    log_info "Installing frontend dependencies..."
    npm install
    log_success "Frontend dependencies installed"
    
    if [ -d "$FUNCTIONS_DIR" ]; then
        log_info "Installing Cloud Functions dependencies..."
        cd "$FUNCTIONS_DIR"
        npm install
        log_success "Cloud Functions dependencies installed"
        cd "$PROJECT_ROOT"
    fi
}

# Build functions
build_functions() {
    print_header "Building Cloud Functions"
    
    if [ -d "$FUNCTIONS_DIR" ]; then
        cd "$FUNCTIONS_DIR"
        
        log_info "Linting TypeScript code..."
        if npm run lint; then
            log_success "Code linting passed"
        else
            log_warning "Code linting found issues (continuing anyway)"
        fi
        
        log_info "Building TypeScript code..."
        npm run build
        log_success "Cloud Functions built successfully"
        
        cd "$PROJECT_ROOT"
    else
        log_warning "No Cloud Functions directory found"
    fi
}

# Start emulators
start_emulators() {
    print_header "Starting Firebase Emulators"
    
    cd "$PROJECT_ROOT"
    
    log_info "Starting Firebase emulators for development..."
    log_info "Emulator UI will be available at: http://localhost:4000"
    log_info "Press Ctrl+C to stop emulators"
    
    # Start emulators with all services
    firebase emulators:start --import=./firebase-export --export-on-exit=./firebase-export
}

# Deploy to emulators (alternative to starting them)
deploy_to_emulators() {
    print_header "Deploying to Firebase Emulators"
    
    cd "$PROJECT_ROOT"
    
    log_info "Deploying security rules to emulators..."
    firebase deploy --only firestore:rules,storage:rules --project demo-project
    
    if [ -d "$FUNCTIONS_DIR" ]; then
        log_info "Deploying Cloud Functions to emulators..."
        firebase deploy --only functions --project demo-project
    fi
    
    log_success "Deployment to emulators completed"
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    cd "$PROJECT_ROOT"
    
    # Test Firebase configuration
    if [ -f "scripts/test-firebase-config.js" ]; then
        log_info "Testing Firebase configuration..."
        node scripts/test-firebase-config.js
        log_success "Firebase configuration test passed"
    fi
    
    # Run frontend tests
    log_info "Running frontend tests..."
    if npm test -- --watchAll=false --passWithNoTests; then
        log_success "Frontend tests passed"
    else
        log_warning "Some frontend tests failed"
    fi
    
    # Run functions tests if available
    if [ -d "$FUNCTIONS_DIR" ] && [ -f "$FUNCTIONS_DIR/package.json" ]; then
        cd "$FUNCTIONS_DIR"
        if grep -q '"test"' package.json; then
            log_info "Running Cloud Functions tests..."
            if npm test; then
                log_success "Cloud Functions tests passed"
            else
                log_warning "Some Cloud Functions tests failed"
            fi
        fi
        cd "$PROJECT_ROOT"
    fi
}

# Build frontend
build_frontend() {
    print_header "Building Frontend Application"
    
    cd "$PROJECT_ROOT"
    
    log_info "Building React application..."
    npm run build
    log_success "Frontend application built successfully"
    
    # Verify build
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        log_success "Build directory created (size: $BUILD_SIZE)"
    else
        log_error "Build directory not found"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                DevInquire Dashboard                          ║"
    echo "║              Development Deployment Script                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    # Parse command line arguments
    COMMAND=${1:-"full"}
    
    case $COMMAND in
        "prereq")
            check_prerequisites
            ;;
        "env")
            setup_environment
            ;;
        "deps")
            install_dependencies
            ;;
        "build")
            build_functions
            build_frontend
            ;;
        "test")
            run_tests
            ;;
        "emulators")
            check_prerequisites
            setup_environment
            install_dependencies
            build_functions
            start_emulators
            ;;
        "deploy-emu")
            check_prerequisites
            setup_environment
            install_dependencies
            build_functions
            deploy_to_emulators
            ;;
        "full")
            check_prerequisites
            setup_environment
            install_dependencies
            build_functions
            run_tests
            build_frontend
            log_success "Development environment setup completed!"
            echo -e "\n${BLUE}Next steps:${NC}"
            echo "  1. Configure your Firebase settings in $ENV_FILE"
            echo "  2. Run 'npm start' to start the development server"
            echo "  3. Run './scripts/deploy-dev.sh emulators' to start Firebase emulators"
            ;;
        *)
            echo "Usage: $0 [command]"
            echo "Commands:"
            echo "  prereq     - Check prerequisites only"
            echo "  env        - Setup environment only"
            echo "  deps       - Install dependencies only"
            echo "  build      - Build functions and frontend only"
            echo "  test       - Run tests only"
            echo "  emulators  - Start Firebase emulators"
            echo "  deploy-emu - Deploy to emulators"
            echo "  full       - Complete setup (default)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"