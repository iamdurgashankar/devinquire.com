# 🚀 Deployment Checklist

Use this checklist to ensure your Dashboard application is ready for production deployment.

## Pre-Deployment Checklist

### ✅ Environment Configuration

- [ ] `.env.production` file exists and is configured
- [ ] All Firebase credentials are set:
  - [ ] `REACT_APP_FIREBASE_API_KEY`
  - [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN`
  - [ ] `REACT_APP_FIREBASE_PROJECT_ID`
  - [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET`
  - [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `REACT_APP_FIREBASE_APP_ID`
  - [ ] `REACT_APP_FIREBASE_MEASUREMENT_ID` (optional)
- [ ] Environment variables don't contain placeholder values (no "your-*" values)

### ✅ Code Quality

- [ ] All code is committed to version control
- [ ] No console.log statements in production code
- [ ] No debug/development code left in production
- [ ] Error boundaries are properly implemented
- [ ] All dependencies are up to date and secure

### ✅ Build Verification

- [ ] Run `npm run prepare:deploy` - all checks pass
- [ ] Run `npm run build` - build completes without errors
- [ ] Build output is generated in `build/` directory
- [ ] Test the build locally: `npx serve -s build`
- [ ] All routes work correctly (no 404 errors on refresh)
- [ ] All assets load correctly (images, fonts, CSS, JS)

### ✅ Firebase Backend

- [ ] Firebase project is set up and configured
- [ ] Firestore security rules are reviewed and tested
- [ ] Storage security rules are reviewed and tested
- [ ] Cloud Functions are deployed (if used)
- [ ] Firebase Authentication is configured
- [ ] Firebase project is set to production mode

### ✅ Security

- [ ] `.env.production` is in `.gitignore` (never commit secrets)
- [ ] API keys are secured and not exposed in client code
- [ ] CORS settings are properly configured
- [ ] Security headers are configured (in vercel.json or netlify.toml)
- [ ] Firebase security rules are production-ready

### ✅ Performance

- [ ] Images are optimized
- [ ] Code splitting is implemented
- [ ] Lazy loading is used where appropriate
- [ ] Bundle size is reasonable (< 1MB initial load)
- [ ] Lighthouse score is acceptable (> 80)

### ✅ Testing

- [ ] All critical user flows are tested
- [ ] Authentication works correctly
- [ ] Data loading from Firestore works
- [ ] Real-time features work (if applicable)
- [ ] Error handling is tested
- [ ] Mobile responsiveness is verified

## Deployment Steps

### Step 1: Prepare Environment

```bash
# Run deployment preparation check
npm run prepare:deploy

# Create production build
npm run build

# Test build locally
npx serve -s build
```

### Step 2: Deploy Backend (Firebase)

```bash
# Deploy Firebase services
firebase deploy --only firestore:rules,storage:rules,functions

# Or use the script
npm run deploy:rules
npm run deploy:functions
```

### Step 3: Deploy Frontend

**Option A: Vercel**

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy
npm run deploy:vercel

# Or use Vercel dashboard:
# 1. Connect GitHub repository
# 2. Add environment variables
# 3. Deploy automatically on push
```

**Option B: Netlify**

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Deploy
npm run deploy:netlify

# Or use Netlify dashboard:
# 1. Connect GitHub repository
# 2. Set build command: npm run build
# 3. Set publish directory: build
# 4. Add environment variables
```

**Option C: Firebase Hosting**

```bash
# Deploy to Firebase Hosting
npm run deploy:firebase
```

### Step 4: Post-Deployment Verification

- [ ] Application loads correctly at production URL
- [ ] Authentication works
- [ ] All routes are accessible
- [ ] Real-time features work
- [ ] No console errors in browser
- [ ] Performance is acceptable
- [ ] Mobile view works correctly
- [ ] Firebase Console shows correct usage

## Environment Variables Setup

### For Vercel:

1. Go to Project Settings → Environment Variables
2. Add all `REACT_APP_*` variables from `.env.production`
3. Set environment to "Production"
4. Redeploy after adding variables

### For Netlify:

1. Go to Site Settings → Environment Variables
2. Add all `REACT_APP_*` variables from `.env.production`
3. Set scope to "Production"
4. Redeploy after adding variables

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build
```

### Environment Variables Not Loading

- Verify variables are set in deployment platform
- Check variable names start with `REACT_APP_`
- Ensure variables are set for "Production" environment
- Redeploy after adding/changing variables

### 404 Errors on Refresh

- Verify `vercel.json` or `netlify.toml` has proper redirect rules
- Check that SPA routing is configured correctly

### Firebase Connection Issues

- Verify Firebase credentials in environment variables
- Check Firebase project is active
- Verify Firestore rules allow necessary operations
- Check browser console for specific error messages

## Monitoring

After deployment, monitor:

- [ ] Application performance (Lighthouse scores)
- [ ] Error rates (browser console, Firebase Console)
- [ ] Firebase usage and costs
- [ ] User authentication success rates
- [ ] API response times

## Rollback Plan

If issues occur:

1. **Vercel**: Use deployment history to rollback to previous version
2. **Netlify**: Use deploy log to rollback
3. **Firebase**: Revert to previous deployment using Firebase Console

## Support

- Check deployment logs in your hosting platform
- Review Firebase Console for backend issues
- Check browser console for frontend errors
- Review `DEPLOYMENT.md` for detailed instructions

---

**Last Updated**: $(date)
**Version**: Check `package.json` for current version

