#!/bin/bash

# DevInquire Dashboard - Deployment Setup Script
# Configures the project for deployment with proper permissions and environment setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

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

# Make scripts executable
setup_script_permissions() {
    print_header "Setting Up Script Permissions"
    
    cd "$PROJECT_ROOT"
    
    # List of scripts to make executable
    SCRIPTS=(
        "scripts/deploy-dev.sh"
        "scripts/deploy-prod.sh"
        "scripts/setup-deployment.sh"
    )
    
    for script in "${SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            log_success "Made executable: $script"
        else
            log_warning "Script not found: $script"
        fi
    done
}

# Create environment files from examples
setup_environment_files() {
    print_header "Setting Up Environment Files"
    
    cd "$PROJECT_ROOT"
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log_success "Created .env.local from .env.example"
            log_warning "Please configure your Firebase settings in .env.local"
        else
            log_info "Creating basic .env.local template"
            cat > .env.local << 'EOF'
# Firebase Configuration - Development
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Measurement ID for Analytics
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Development Settings
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true

# API Configuration
REACT_APP_API_URL=http://localhost:5001/your_project_id/us-central1
EOF
            log_success "Created .env.local template"
            log_warning "Please update the Firebase configuration in .env.local"
        fi
    else
        log_info ".env.local already exists"
    fi
    
    # Create .env.production template if it doesn't exist
    if [ ! -f ".env.production" ]; then
        log_info "Creating .env.production template"
        cat > .env.production << 'EOF'
# Firebase Configuration - Production
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_production_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_production_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
REACT_APP_FIREBASE_APP_ID=your_production_app_id

# Optional: Firebase Measurement ID for Analytics
REACT_APP_FIREBASE_MEASUREMENT_ID=your_production_measurement_id

# Production Settings
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false

# API Configuration
REACT_APP_API_URL=https://us-central1-your_production_project.cloudfunctions.net
EOF
        log_success "Created .env.production template"
        log_warning "Please update the Firebase configuration in .env.production"
    else
        log_info ".env.production already exists"
    fi
}

# Setup package.json scripts
setup_package_scripts() {
    print_header "Setting Up Package.json Scripts"
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        return 1
    fi
    
    # Create a backup
    cp package.json package.json.backup
    log_info "Created package.json backup"
    
    # Add deployment scripts using Node.js to modify JSON
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Add deployment scripts
        pkg.scripts = pkg.scripts || {};
        
        const newScripts = {
            'deploy:dev': './scripts/deploy-dev.sh',
            'deploy:prod': './scripts/deploy-prod.sh',
            'deploy:setup': './scripts/setup-deployment.sh',
            'test:firebase': 'node scripts/test-firebase-config.js',
            'emulators': './scripts/deploy-dev.sh emulators',
            'build:functions': 'cd firebase/functions && npm run build',
            'deploy:functions': 'firebase deploy --only functions',
            'deploy:rules': 'firebase deploy --only firestore:rules,storage:rules',
            'deploy:hosting': 'firebase deploy --only hosting'
        };
        
        Object.assign(pkg.scripts, newScripts);
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('Package.json scripts updated');
    "
    
    log_success "Added deployment scripts to package.json"
}

# Setup Firebase project structure
setup_firebase_structure() {
    print_header "Setting Up Firebase Project Structure"
    
    cd "$PROJECT_ROOT"
    
    # Create firebase directory if it doesn't exist
    if [ ! -d "firebase" ]; then
        mkdir -p firebase
        log_success "Created firebase directory"
    fi
    
    # Create backups directory
    if [ ! -d "backups" ]; then
        mkdir -p backups
        log_success "Created backups directory"
    fi
    
    # Create firebase-export directory for emulator data
    if [ ! -d "firebase-export" ]; then
        mkdir -p firebase-export
        log_success "Created firebase-export directory for emulator data"
    fi
    
    # Add .gitignore entries for deployment artifacts
    if [ -f ".gitignore" ]; then
        # Check if deployment entries already exist
        if ! grep -q "# Deployment artifacts" .gitignore; then
            cat >> .gitignore << 'EOF'

# Deployment artifacts
backups/
firebase-export/
.env.local
.env.production
package.json.backup

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Functions
firebase/functions/lib/
firebase/functions/node_modules/
firebase/functions/.runtimeconfig.json
EOF
            log_success "Added deployment entries to .gitignore"
        else
            log_info "Deployment entries already exist in .gitignore"
        fi
    else
        log_warning ".gitignore not found"
    fi
}

# Create deployment documentation
create_deployment_docs() {
    print_header "Creating Deployment Documentation"
    
    cd "$PROJECT_ROOT"
    
    # Create DEPLOYMENT.md
    cat > DEPLOYMENT.md << 'EOF'
# DevInquire Dashboard - Deployment Guide

This guide covers the deployment process for the DevInquire Dashboard application.

## Prerequisites

1. **Node.js** (v18.0.0 or higher)
2. **Firebase CLI** (`npm install -g firebase-tools`)
3. **Git** (for version control)
4. **Firebase Project** (configured with Authentication, Firestore, Functions, Hosting, and Storage)

## Quick Start

### Initial Setup

```bash
# 1. Setup deployment environment
npm run deploy:setup

# 2. Configure Firebase project
firebase login
firebase use --add

# 3. Configure environment variables
# Edit .env.local and .env.production with your Firebase config

# 4. Test configuration
npm run test:firebase
```

### Development Deployment

```bash
# Full development setup
npm run deploy:dev

# Or start emulators only
npm run emulators

# Individual components
./scripts/deploy-dev.sh build    # Build only
./scripts/deploy-dev.sh test     # Test only
./scripts/deploy-dev.sh deps     # Install dependencies only
```

### Production Deployment

```bash
# Full production deployment (with confirmation)
npm run deploy:prod

# Skip confirmation (use with caution)
./scripts/deploy-prod.sh full --yes

# Individual components
./scripts/deploy-prod.sh build   # Build only
./scripts/deploy-prod.sh test    # Test only
./scripts/deploy-prod.sh deploy  # Deploy only
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run deploy:dev` | Full development setup |
| `npm run deploy:prod` | Full production deployment |
| `npm run deploy:setup` | Initial deployment setup |
| `npm run test:firebase` | Test Firebase configuration |
| `npm run emulators` | Start Firebase emulators |
| `npm run build:functions` | Build Cloud Functions |
| `npm run deploy:functions` | Deploy Functions only |
| `npm run deploy:rules` | Deploy security rules only |
| `npm run deploy:hosting` | Deploy hosting only |

## Environment Configuration

### Development (.env.local)

```env
REACT_APP_FIREBASE_API_KEY=your_dev_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_dev_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_dev_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_dev_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
REACT_APP_FIREBASE_APP_ID=your_dev_app_id
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### Production (.env.production)

```env
REACT_APP_FIREBASE_API_KEY=your_prod_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_prod_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_prod_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_prod_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
REACT_APP_FIREBASE_APP_ID=your_prod_app_id
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

## Deployment Process

### Development Workflow

1. **Setup**: Run `npm run deploy:setup` once
2. **Configure**: Update `.env.local` with your Firebase config
3. **Test**: Run `npm run test:firebase` to validate setup
4. **Develop**: Use `npm run emulators` for local development
5. **Deploy**: Run `npm run deploy:dev` for full setup

### Production Workflow

1. **Prepare**: Ensure all tests pass and code is committed
2. **Configure**: Update `.env.production` with production Firebase config
3. **Test**: Run `npm run test:firebase` to validate
4. **Deploy**: Run `npm run deploy:prod` (includes confirmation)
5. **Verify**: Check the deployed application

## Troubleshooting

### Common Issues

1. **Permission Denied**: Run `chmod +x scripts/*.sh`
2. **Firebase Not Logged In**: Run `firebase login`
3. **Project Not Set**: Run `firebase use --add`
4. **Environment Variables**: Check `.env.local` and `.env.production`
5. **Node Version**: Ensure Node.js v18+ is installed

### Logs and Debugging

```bash
# View function logs
firebase functions:log

# View emulator logs
firebase emulators:start --debug

# Test configuration
node scripts/test-firebase-config.js
```

## Security Considerations

1. **Environment Files**: Never commit `.env.local` or `.env.production`
2. **Firebase Rules**: Review security rules before deployment
3. **API Keys**: Use Firebase security rules, not API key restrictions
4. **HTTPS**: Always use HTTPS in production
5. **Backups**: Automatic backups are created before production deployments

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase Console for errors
3. Check application logs
4. Consult Firebase documentation
EOF

    log_success "Created DEPLOYMENT.md documentation"
}

# Validate setup
validate_setup() {
    print_header "Validating Setup"
    
    cd "$PROJECT_ROOT"
    
    local issues=0
    
    # Check required files
    local required_files=(
        "package.json"
        "firebase.json"
        "firestore.rules"
        "storage.rules"
        ".env.local"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Found: $file"
        else
            log_warning "Missing: $file"
            ((issues++))
        fi
    done
    
    # Check required directories
    local required_dirs=(
        "src"
        "public"
        "firebase/functions"
        "scripts"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_success "Found: $dir/"
        else
            log_warning "Missing: $dir/"
            ((issues++))
        fi
    done
    
    # Check script permissions
    local scripts=(
        "scripts/deploy-dev.sh"
        "scripts/deploy-prod.sh"
        "scripts/setup-deployment.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -x "$script" ]; then
            log_success "Executable: $script"
        else
            log_warning "Not executable: $script"
            ((issues++))
        fi
    done
    
    # Check Firebase CLI
    if command -v firebase &> /dev/null; then
        log_success "Firebase CLI is installed"
    else
        log_error "Firebase CLI is not installed"
        ((issues++))
    fi
    
    # Summary
    if [ $issues -eq 0 ]; then
        log_success "Setup validation passed!"
    else
        log_warning "Setup validation found $issues issues"
    fi
    
    return $issues
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                DevInquire Dashboard                          ║"
    echo "║              Deployment Setup Script                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    log_info "Setting up deployment environment..."
    
    setup_script_permissions
    setup_environment_files
    setup_package_scripts
    setup_firebase_structure
    create_deployment_docs
    validate_setup
    
    echo -e "\n${GREEN}🎉 Deployment setup completed!${NC}\n"
    
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Configure Firebase: firebase login && firebase use --add"
    echo "  2. Update .env.local with your Firebase configuration"
    echo "  3. Test setup: npm run test:firebase"
    echo "  4. Start development: npm run deploy:dev"
    echo "  5. Read DEPLOYMENT.md for detailed instructions"
    
    echo -e "\n${YELLOW}Important:${NC}"
    echo "  - Never commit .env.local or .env.production files"
    echo "  - Review security rules before production deployment"
    echo "  - Test thoroughly in development before deploying to production"
}

# Run main function
main "$@"