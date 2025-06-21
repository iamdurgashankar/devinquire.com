# 🚀 Deploy Devinquire to Hostinger Using GitHub

This guide will walk you through deploying your Devinquire project to Hostinger using GitHub for continuous deployment.

## 📋 Prerequisites

1. **Hostinger Account**: Active hosting plan with domain devinquire.com
2. **GitHub Account**: To host your repository
3. **FTP Credentials**: From your Hostinger control panel

## 🔧 Step 1: Create GitHub Repository

### Option A: Create New Repository on GitHub

1. **Go to GitHub.com** and sign in
2. **Click "New repository"**
3. **Repository name**: `devinquire`
4. **Description**: `Devinquire Agency Web Application`
5. **Make it Public** (or Private if you prefer)
6. **Don't initialize** with README (we already have one)
7. **Click "Create repository"**

### Option B: Connect Existing Local Repository

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
Devinquire Agency Web Application https://github.com/YOUR_USERNAME/devinquire.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔧 Step 2: Get Hostinger FTP Credentials

1. **Login to Hostinger Control Panel**

   - Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Login with your Hostinger account

2. **Find FTP Credentials**
   - Go to **Files** → **FTP Accounts**
   - Note down:
     - **FTP Server**: Usually `devinquire.com` or `ftp.devinquire.com`
     - **FTP Username**: Your FTP username
     - **FTP Password**: Your FTP password
     - **Server Directory**: Usually `/public_html/`

## 🔧 Step 3: Set Up GitHub Secrets

1. **Go to your GitHub repository**

   - Navigate to **Settings** → **Secrets and variables** → **Actions**

2. **Add these secrets:**

   ```
   HOSTINGER_FTP_SERVER=your-ftp-server.com
   HOSTINGER_FTP_USERNAME=your-ftp-username
   HOSTINGER_FTP_PASSWORD=your-ftp-password
   HOSTINGER_SERVER_DIR=/public_html/
   ```

   **Example:**

   ```
   HOSTINGER_FTP_SERVER=devinquire.com
   HOSTINGER_FTP_USERNAME=u180145459_devinquire
   HOSTINGER_FTP_PASSWORD=your-ftp-password
   HOSTINGER_SERVER_DIR=/public_html/
   ```

## 🔧 Step 4: Configure Domain in Hostinger

1. **In Hostinger Control Panel**

   - Go to **Domains** → **Manage**
   - Ensure devinquire.com points to your hosting
   - Set up SSL certificate (free with Hostinger)

2. **Enable SSL**
   - Go to **SSL** → **Manage**
   - Enable SSL for devinquire.com
   - Wait for certificate to activate (usually 5-10 minutes)

## 🔧 Step 5: Deploy Your Code

### Method 1: Automatic Deployment (Recommended)

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Setup for Hostinger deployment"
   git push origin main
   ```

2. **Check GitHub Actions**
   - Go to **Actions** tab in your GitHub repository
   - Watch the "Deploy to Hostinger" workflow run
   - Wait for deployment to complete

### Method 2: Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Set your FTP credentials as environment variables
export HOSTINGER_FTP_SERVER="your-ftp-server.com"
export HOSTINGER_FTP_USERNAME="your-ftp-username"
export HOSTINGER_FTP_PASSWORD="your-ftp-password"

# Run the deployment script
./scripts/hostinger-deploy.sh
```

## 🔧 Step 6: Configure Backend (Important!)

Since Hostinger shared hosting doesn't support Node.js directly, you have options:

### Option A: Use External Backend (Recommended)

1. **Deploy backend to Railway/Render**

   - Go to [railway.app](https://railway.app) or [render.com](https://render.com)
   - Connect your GitHub repository
   - Deploy only the `backend/` folder
   - Get your backend URL (e.g., `https://devinquire-backend.railway.app`)

2. **Update Frontend API URL**
   - In your React app, update the API URL to point to your external backend
   - Update environment variables in Hostinger

### Option B: Use Hostinger VPS

1. **Upgrade to Hostinger VPS plan**
2. **Install Node.js on VPS**
3. **Deploy backend to VPS**

### Option C: Convert to PHP Backend

1. **Convert Node.js backend to PHP**
2. **Deploy PHP files to Hostinger**

## 🔧 Step 7: Environment Variables

### For Frontend (in Hostinger)

Create a `.env` file in your Hostinger public_html directory:

```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### For Backend (if using external hosting)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://devinquire.com
```

## 🔧 Step 8: Test Your Deployment

1. **Visit your site**: [devinquire.com](https://devinquire.com)
2. **Check functionality**:
   - Homepage loads correctly
   - Blog section works
   - Admin panel accessible
   - Images upload properly
   - API endpoints respond

## 🔄 Continuous Deployment

Once set up, every push to your `main` branch will:

1. ✅ Build your React frontend
2. ✅ Package backend files
3. ✅ Upload to Hostinger via FTP
4. ✅ Update devinquire.com automatically

## 🛠️ Troubleshooting

### Common Issues:

1. **FTP Connection Failed**

   - Verify FTP credentials
   - Check if FTP is enabled in Hostinger
   - Try SFTP instead of FTP

2. **Build Failures**

   - Check GitHub Actions logs
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

3. **React Router Not Working**

   - Ensure `.htaccess` file is uploaded
   - Check if mod_rewrite is enabled
   - Verify RewriteBase path

4. **SSL Issues**
   - Enable SSL in Hostinger control panel
   - Wait for certificate propagation (up to 24 hours)
   - Check mixed content warnings

### Debug Steps:

1. **Check GitHub Actions**

   - Go to Actions tab
   - Click on failed workflow
   - Review error logs

2. **Check Hostinger Logs**

   - Go to **Advanced** → **Error Logs**
   - Look for recent errors

3. **Test FTP Connection**
   - Use FileZilla or similar FTP client
   - Test connection with your credentials

## 📞 Support

- **Hostinger Support**: [support.hostinger.com](https://support.hostinger.com)
- **GitHub Actions**: [docs.github.com/en/actions](https://docs.github.com/en/actions)
- **FTP Issues**: Check Hostinger knowledge base

## 🎯 Quick Commands

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/devinquire.git
git branch -M main
git push -u origin main

# Deploy manually (if needed)
./scripts/hostinger-deploy.sh
```

## ✅ Success Checklist

- [ ] GitHub repository created and code pushed
- [ ] Hostinger FTP credentials obtained
- [ ] GitHub secrets configured
- [ ] Domain configured in Hostinger
- [ ] SSL certificate enabled
- [ ] First deployment completed
- [ ] Site accessible at devinquire.com
- [ ] All functionality working
- [ ] Continuous deployment tested

Your site will be live at devinquire.com with automatic updates! 🎉
