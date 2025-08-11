# 🚀 Hostinger Auto-Deployment Setup

This guide explains how to set up automatic deployment from GitHub to Hostinger for the DevInquire project.

## 📋 Prerequisites

- GitHub repository: `https://github.com/iamdurgashankar/devinquire.com`
- Hostinger hosting account with Node.js support
- MySQL database on Hostinger
- Domain configured: `devinquire.com`

## 🔧 Setup Instructions

### 1. GitHub Webhook Configuration

The webhook is already configured in this repository:
- **Webhook URL**: `https://webhooks.hostinger.com/deploy/6a336b05bd6b1e6e2060ee80c41c2c01`
- **GitHub Setup URL**: `https://github.com/iamdurgashankar/devinquire.com/settings/hooks/new`

#### Manual Webhook Setup (if needed):
1. Go to your GitHub repository settings
2. Click on "Webhooks" in the left sidebar
3. Click "Add webhook"
4. Enter the webhook URL: `https://webhooks.hostinger.com/deploy/6a336b05bd6b1e6e2060ee80c41c2c01`
5. Set Content type to: `application/json`
6. Select "Just the push event"
7. Ensure "Active" is checked
8. Click "Add webhook"

### 2. Hostinger Configuration

#### File Structure on Hostinger:
```
public_html/
├── index.html              # Main React app
├── static/                 # React build assets
├── dashboard/              # Admin dashboard
│   ├── index.html
│   └── static/
├── api/                    # PHP backend
│   ├── db.php
│   ├── *.php files
│   └── schema files
└── .htaccess              # URL rewriting rules
```

#### Environment Setup:
1. **Node.js Version**: Ensure Node.js 16+ is available
2. **PHP Version**: Set to PHP 7.4 or higher
3. **MySQL Database**: Create database and import schema files

### 3. Database Setup

1. Create a MySQL database on Hostinger
2. Import the following schema files in order:
   ```bash
   mysql -u username -p database_name < api/schema.sql
   mysql -u username -p database_name < api/posts_schema.sql
   mysql -u username -p database_name < api/users_schema.sql
   ```
3. Update database credentials in `api/db.php`:
   ```php
   $host = 'localhost';
   $dbname = 'your_database_name';
   $username = 'your_db_username';
   $password = 'your_db_password';
   ```

### 4. Deployment Process

The deployment happens automatically when you push to the `main` branch:

1. **GitHub Actions Trigger**: Push to main branch triggers the workflow
2. **Build Process**: 
   - Install dependencies for main app and dashboard
   - Build both React applications
   - Trigger Hostinger webhook
3. **Hostinger Deployment**:
   - Execute `deploy.sh` script
   - Copy built files to `public_html`
   - Set up `.htaccess` files
   - Configure file permissions

## 🔄 Manual Deployment

If you need to deploy manually:

```bash
# On your local machine or Hostinger terminal
./deploy.sh
```

Or step by step:
```bash
# Install dependencies
npm install
cd dashboard && npm install && cd ..

# Build applications
npm run build
cd dashboard && npm run build && cd ..

# Copy files (adjust paths as needed)
cp -r build/* public_html/
cp -r dashboard/build/* public_html/dashboard/
cp -r api public_html/
```

## 🛠️ Troubleshooting

### Common Issues:

1. **404 Errors on React Routes**:
   - Check `.htaccess` files are properly configured
   - Ensure URL rewriting is enabled on Hostinger

2. **API Connection Errors**:
   - Verify database credentials in `api/db.php`
   - Check MySQL database is accessible
   - Ensure CORS headers are properly set

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for any syntax errors in code

4. **Permission Errors**:
   - Files should have 644 permissions
   - Directories should have 755 permissions
   - PHP files should be executable

### Debug Commands:

```bash
# Check file permissions
find public_html -type f -exec ls -la {} \;

# Test API endpoint
curl https://devinquire.com/api/session.php

# Check error logs
tail -f /path/to/error.log
```

## 🔍 Health Checks

After deployment, verify these URLs:
- ✅ Main site: `https://devinquire.com/`
- ✅ Dashboard: `https://devinquire.com/dashboard/`
- ✅ API health: `https://devinquire.com/api/session.php`
- ✅ Blog posts: `https://devinquire.com/api/get_posts.php`

## 📞 Support

If you encounter issues:
1. Check Hostinger's deployment logs
2. Review GitHub Actions workflow results
3. Verify webhook delivery in GitHub settings
4. Contact Hostinger support for server-specific issues

## 🔄 Rollback Process

If deployment fails:
1. Check the previous working commit
2. Revert to that commit: `git revert <commit-hash>`
3. Push the revert to trigger new deployment
4. Or manually restore from backup on Hostinger

---

**Note**: This setup assumes you have proper access to both GitHub repository and Hostinger hosting account.