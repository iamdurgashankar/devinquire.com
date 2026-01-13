# Quick Setup Guide - Dashboard

## Step 1: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp env.example .env.local
   ```

2. **Get your Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project (or create a new one)
   - Go to Project Settings (gear icon) → General tab
   - Scroll to "Your apps" section
   - If you don't have a web app, click "Add app" → Web (</> icon)
   - Copy all the configuration values

3. **Update `.env.local` with your Firebase values:**
   ```env
   REACT_APP_FIREBASE_API_KEY=AIzaSy...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build for Production

```bash
# For production deployment
cp env.production.example .env.production
# Edit .env.production with your values
npm run build
```

## Step 4: Deploy

Upload the `build/` folder contents to your hosting provider.

**For Vercel/Netlify:**
- Connect your repository
- Set environment variables in the dashboard
- Deploy automatically on push

**For Static Hosting:**
- Upload `build/` folder contents to your web server
- Make sure `.env.production` values are set in your build

## That's it! 🎉

Your Dashboard should now work with Firebase authentication and all features enabled.

