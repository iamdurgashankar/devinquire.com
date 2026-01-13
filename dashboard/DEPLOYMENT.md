# DevInquire Dashboard - Deployment Guide

This guide provides clear, unambiguous instructions for deploying both the backend and frontend components of the DevInquire Dashboard application.

## 📋 Overview

The DevInquire Dashboard consists of two main components:
- **Backend**: Firebase services (Functions, Firestore, Authentication, Storage)
- **Frontend**: React application that can be deployed to either Vercel OR Netlify (choose one)

## 🔧 Prerequisites

Before deploying, ensure you have:

1. **Node.js** (version 18 or higher)
2. **npm** (version 9 or higher)
3. **Firebase CLI** installed globally: `npm install -g firebase-tools`
4. **Firebase Project** configured with:
   - Authentication
   - Firestore Database
   - Cloud Functions
   - Cloud Storage
   - Firebase Hosting (optional, if not using Vercel/Netlify)
5. **Environment Variables** properly configured (see `.env.production.example`)

## 🔥 Backend Deployment (Firebase)

The backend consists of Firebase services and must be deployed using Firebase CLI.

### 1. Setup Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Set the correct Firebase project
firebase use your-project-id
```

### 2. Configure Environment Variables

Create or update `.env.production` with your production Firebase configuration:

```bash
cp .env.production.example .env.production
# Edit .env.production with your actual values
```

### 3. Deploy Backend Services

#### Option A: Full Backend Deployment (Recommended)

```bash
# Run the production deployment script
npm run deploy:prod

# Or use the script directly
./scripts/deploy-prod.sh
```

This script will:
- Deploy Firestore security rules
- Deploy Storage security rules
- Deploy Cloud Functions
- Run safety checks and confirmations

#### Option B: Deploy Individual Services

```bash
# Deploy security rules only
firebase deploy --only firestore:rules,storage:rules

# Deploy Cloud Functions only
firebase deploy --only functions

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 4. Verify Backend Deployment

```bash
# Check deployment status
firebase projects:list

# Test Cloud Functions
firebase functions:log

# Verify Firestore rules
firebase firestore:rules:get
```

## 🌐 Frontend Deployment

**IMPORTANT**: Choose EITHER Vercel OR Netlify for frontend deployment. Do not use both simultaneously.

### Option 1: Deploy to Vercel (Recommended)

Vercel provides excellent React support and automatic deployments from Git.

#### Setup Vercel Deployment

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a React app

3. **Configure Environment Variables in Vercel**:
   - Go to your project settings in Vercel dashboard
   - Add all `REACT_APP_*` variables from your `.env.production` file
   - Required variables:
     ```
     REACT_APP_FIREBASE_API_KEY
     REACT_APP_FIREBASE_AUTH_DOMAIN
     REACT_APP_FIREBASE_PROJECT_ID
     REACT_APP_FIREBASE_STORAGE_BUCKET
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID
     REACT_APP_FIREBASE_APP_ID
     REACT_APP_FIREBASE_MEASUREMENT_ID
     REACT_APP_USE_FIREBASE_EMULATOR=false
     ```

4. **Deploy**:
   - Automatic: Push to your main branch
   - Manual: Use `vercel --prod` command

#### Vercel Configuration

The project includes `vercel.json` with optimized settings:
- Static build configuration
- Proper routing for SPA
- Cache headers for performance

### Option 2: Deploy to Netlify (Alternative)

If you prefer Netlify over Vercel:

#### Setup Netlify Deployment

1. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Choose "Deploy site"

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment Variables**:
   - Go to Site settings > Environment variables
   - Add all `REACT_APP_*` variables from `.env.production`

4. **Deploy**:
   - Automatic: Push to your main branch
   - Manual: Drag and drop `build` folder

#### Netlify Configuration

The project includes `netlify.toml` with:
- Build configuration
- Environment variables (update with your values)
- Redirect rules for SPA
- Cache headers

## 🚀 Complete Deployment Process

### Development to Production Workflow

1. **Prepare for Deployment**:
   ```bash
   # Ensure all changes are committed
   git status
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy Backend First**:
   ```bash
   # Deploy Firebase backend
   npm run deploy:prod
   ```

3. **Deploy Frontend** (choose one):
   
   **For Vercel**:
   - Push to main branch (automatic deployment)
   - Or run: `vercel --prod`
   
   **For Netlify**:
   - Push to main branch (automatic deployment)
   - Or manually upload build folder

4. **Verify Deployment**:
   - Test the live application
   - Check Firebase Console for backend status
   - Monitor logs for any issues

## 🔍 Deployment Verification

### Backend Verification

```bash
# Check Firebase project status
firebase projects:list

# View function logs
firebase functions:log --limit 50

# Test Firestore connection
firebase firestore:indexes:list
```

### Frontend Verification

1. **Access your deployed application**:
   - Vercel: `https://your-app.vercel.app`
   - Netlify: `https://your-app.netlify.app`

2. **Test key functionality**:
   - User authentication
   - Data loading from Firestore
   - Real-time features
   - API endpoints

## 🛠️ Troubleshooting

### Common Backend Issues

1. **Functions deployment fails**:
   ```bash
   # Check function logs
   firebase functions:log
   
   # Redeploy specific function
   firebase deploy --only functions:functionName
   ```

2. **Security rules rejected**:
   ```bash
   # Validate rules locally
   firebase emulators:start --only firestore
   
   # Test rules
   firebase firestore:rules:test
   ```

### Common Frontend Issues

1. **Environment variables not loading**:
   - Verify all `REACT_APP_*` variables are set in deployment platform
   - Check build logs for missing variables
   - Ensure variables don't contain sensitive data

2. **Build fails**:
   ```bash
   # Test build locally
   npm run build
   
   # Check for TypeScript/ESLint errors
   npm run lint
   ```

3. **Routing issues (404 on refresh)**:
   - Verify SPA redirect rules are configured
   - Check `vercel.json` or `netlify.toml` configuration

## 📊 Deployment Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run deploy:prod` | Full production deployment (Firebase backend) |
| `npm run deploy:dev` | Development deployment with emulators |
| `npm run deploy:setup` | Initial deployment setup |
| `npm run deploy:functions` | Deploy Cloud Functions only |
| `npm run deploy:rules` | Deploy security rules only |
| `npm run deploy:hosting` | Deploy to Firebase Hosting (if used) |

## 🔒 Security Considerations

1. **Environment Variables**:
   - Never commit `.env.production` to version control
   - Use deployment platform's environment variable settings
   - Regularly rotate API keys and secrets

2. **Firebase Security**:
   - Review Firestore security rules before deployment
   - Enable Firebase App Check for production
   - Monitor Firebase usage and billing

3. **Frontend Security**:
   - Enable HTTPS (automatic on Vercel/Netlify)
   - Configure proper CORS settings
   - Implement Content Security Policy headers

## 📈 Monitoring and Maintenance

### Backend Monitoring

- **Firebase Console**: Monitor usage, performance, and errors
- **Cloud Functions Logs**: Track function execution and errors
- **Firestore Usage**: Monitor read/write operations and costs

### Frontend Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Netlify Analytics**: Site performance and visitor data
- **Browser Console**: Check for client-side errors

## 🆘 Support and Resources

- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Project Issues**: Create an issue in the GitHub repository

---

## ⚠️ Important Notes

1. **Choose ONE frontend deployment platform**: Either Vercel OR Netlify, not both
2. **Backend must be deployed first**: Firebase services are required for frontend functionality
3. **Environment variables are critical**: Ensure all required variables are properly configured
4. **Test thoroughly**: Always test in a staging environment before production deployment
5. **Monitor costs**: Keep track of Firebase and hosting platform usage to avoid unexpected charges

For additional help or questions, refer to the project documentation or create an issue in the repository.