# Moving Dashboard to Subdomain: dashboard.devinquire.com

This guide explains how to move your entire dashboard application to a subdomain `dashboard.devinquire.com`.

## Overview

Currently, your application is deployed as a single-page React app with the admin dashboard accessible at `/admin`. To move it to a subdomain, you'll need to:

1. Configure DNS settings
2. Update deployment configuration
3. Modify API configuration
4. Update routing (optional)
5. Configure web server settings

## Step 1: DNS Configuration

### At Your Domain Registrar/DNS Provider:

1. **Add a CNAME record:**
   - **Name/Host:** `dashboard`
   - **Type:** `CNAME`
   - **Value/Target:** `devinquire.com` (or your hosting provider's domain)
   - **TTL:** 3600 (1 hour)

2. **Alternative: Add an A record (if you have a static IP):**
   - **Name/Host:** `dashboard`
   - **Type:** `A`
   - **Value:** Your server's IP address
   - **TTL:** 3600

## Step 2: Hosting Configuration

### For Hostinger (based on your current setup):

1. **Create a new subdomain in your hosting panel:**
   - Go to your Hostinger control panel
   - Navigate to "Subdomains"
   - Add `dashboard` as a subdomain
   - Point it to a new directory (e.g., `/public_html/dashboard/`)

2. **Update your deployment workflow:**
   - You'll need separate deployment for the subdomain
   - The main site can remain at the root domain
   - Dashboard will be deployed to the subdomain directory

## Step 3: Application Configuration Updates

### 3.1 Update API Configuration

Modify `src/config.js`:

```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : window.location.hostname === 'dashboard.devinquire.com'
    ? 'https://devinquire.com/api'  // API still on main domain
    : 'https://devinquire.com/api';

export { API_BASE };
```

### 3.2 Update Router Configuration (Optional)

If you want to remove `/admin` prefix since the entire subdomain is for dashboard:

Modify `src/App.js`:

```javascript
// Change admin routes from:
<Route path="/admin" element={<Admin />} />
<Route path="/admin/page-manager" element={<PageManager />} />
<Route path="/admin/page-builder/:pageId" element={<PageBuilderWrapper />} />

// To:
<Route path="/" element={<Admin />} />
<Route path="/page-manager" element={<PageManager />} />
<Route path="/page-builder/:pageId" element={<PageBuilderWrapper />} />
```

### 3.3 Create Separate Build Configuration

Create `package-dashboard.json` for dashboard-specific build:

```json
{
  "name": "devinquire-dashboard",
  "version": "1.0.0",
  "private": true,
  "homepage": "https://dashboard.devinquire.com",
  "dependencies": {
    // ... same as package.json
  },
  "scripts": {
    "start": "react-scripts start",
    "build:dashboard": "REACT_APP_BUILD_TYPE=dashboard react-scripts build",
    "build": "react-scripts build"
  }
}
```

## Step 4: Deployment Configuration

### 4.1 Create Separate GitHub Workflow

Create `.github/workflows/dashboard-deploy.yml`:

```yaml
name: Deploy Dashboard to Subdomain

on:
  push:
    branches: [main, master]
    paths:
      - 'src/components/Admin*'
      - 'src/components/BlogManager*'
      - 'src/components/PageManager*'
      - 'src/components/UserManager*'
      - 'src/pages/Admin*'
  workflow_dispatch:

jobs:
  deploy-dashboard:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Dashboard
        run: npm run build
        env:
          CI: false
          REACT_APP_BUILD_TYPE: dashboard

      - name: Deploy Dashboard to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.HOSTINGER_FTP_SERVER }}
          username: ${{ secrets.HOSTINGER_FTP_USERNAME }}
          password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
          local-dir: ./build/
          server-dir: ${{ secrets.HOSTINGER_DASHBOARD_DIR }}  # New secret for dashboard directory
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
            **/.env*
```

### 4.2 Update .htaccess for Subdomain

Create `public/.htaccess-dashboard`:

```apache
RewriteEngine On
RewriteBase /

# Handle React Router
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# CORS for API calls to main domain
Header always set Access-Control-Allow-Origin "https://devinquire.com"
Header always set Access-Control-Allow-Credentials "true"
```

## Step 5: Environment-Specific Configuration

### 5.1 Create Environment Detection

Add to `src/config.js`:

```javascript
const IS_DASHBOARD_SUBDOMAIN = window.location.hostname === 'dashboard.devinquire.com';
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE = IS_LOCALHOST
  ? 'http://localhost:8000'
  : 'https://devinquire.com/api';

const APP_TYPE = IS_DASHBOARD_SUBDOMAIN ? 'dashboard' : 'main';

export { API_BASE, IS_DASHBOARD_SUBDOMAIN, APP_TYPE };
```

### 5.2 Conditional App Rendering

Modify `src/App.js` to show only dashboard routes on subdomain:

```javascript
import { IS_DASHBOARD_SUBDOMAIN } from './config';

function AppContent() {
  const location = useLocation();
  
  if (IS_DASHBOARD_SUBDOMAIN) {
    // Only show dashboard routes on subdomain
    return (
      <div className="dynamic-bg">
        {/* Background orbs */}
        <div className="min-h-screen relative z-10">
          <Routes>
            <Route path="/" element={<Admin />} />
            <Route path="/page-manager" element={<PageManager />} />
            <Route path="/page-builder/:pageId" element={<PageBuilderWrapper />} />
            <Route path="/page-builder" element={<PageBuilder />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    );
  }
  
  // Original app content for main domain
  // ... existing code
}
```

## Step 6: Implementation Steps

### Immediate Steps:

1. **Configure DNS** (Step 1)
2. **Set up subdomain in hosting** (Step 2)
3. **Update GitHub secrets** for dashboard deployment directory

### Code Changes:

1. **Update configuration files** (Steps 3.1, 5.1)
2. **Create deployment workflow** (Step 4.1)
3. **Modify routing** (Steps 3.2, 5.2)
4. **Test locally** with different hostnames

### Deployment:

1. **Deploy to subdomain** using new workflow
2. **Test functionality** on dashboard.devinquire.com
3. **Update main site** to remove admin routes (optional)

## Step 7: Testing

### Local Testing:

1. **Add to `/etc/hosts`:**
   ```
   127.0.0.1 dashboard.devinquire.local
   ```

2. **Test with different URLs:**
   - `http://localhost:3000` (main site)
   - `http://dashboard.devinquire.local:3000` (dashboard)

### Production Testing:

1. **Verify DNS propagation:**
   ```bash
   nslookup dashboard.devinquire.com
   ```

2. **Test dashboard functionality:**
   - Login/authentication
   - API calls to main domain
   - All admin features

## Step 8: Security Considerations

1. **CORS Configuration:** Ensure API allows requests from subdomain
2. **SSL Certificate:** Make sure subdomain has valid SSL
3. **Session Management:** Verify cookies work across subdomains
4. **Authentication:** Test login flow from subdomain

## Rollback Plan

If issues occur:

1. **DNS:** Remove subdomain CNAME record
2. **Deployment:** Revert to original workflow
3. **Code:** Keep original routes as fallback

## Benefits of This Approach

1. **Separation of Concerns:** Admin interface isolated from public site
2. **Performance:** Smaller bundle size for each domain
3. **Security:** Admin interface on separate subdomain
4. **Scalability:** Can deploy admin and public site independently
5. **User Experience:** Clean URLs for admin users

This setup allows you to maintain the current functionality while providing a dedicated subdomain for your dashboard interface.