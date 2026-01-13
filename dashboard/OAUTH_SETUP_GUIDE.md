# 🔐 OAuth Setup Guide - Fix "OAuth client not found" Error

## 🚨 **Current Issue**
Error: \"OAuth client not found (Error 401: invalid_client)\" when attempting Google login.

## 🎯 **Root Cause**
The Google OAuth client ID is not properly configured in your application environment variables.

---

## 📋 **Step-by-Step Solution**

### **Step 1: Google Cloud Platform Configuration**

#### **1.1 Access Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project `devinquirecom` (or create a new one if needed)

#### **1.2 Enable Required APIs**
1. Navigate to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google+ API** (for profile information)
   - **Google Identity and Access Management (IAM) API**
   - **Identity and Access Management (IAM) API**

#### **1.3 Create OAuth 2.0 Credentials**
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** user type
   - Fill in required fields:
     - App name: `DevInquire Dashboard`
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email addresses)

#### **1.4 Configure OAuth Client**
1. Select **Web application** as application type
2. Name: `DevInquire Dashboard Web Client`
3. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   https://yourdomain.com
   ```
4. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:3001/auth/google/callback
   http://localhost:3002/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```
5. Click **CREATE**
6. **📋 Copy the Client ID** - you'll need this for Step 2

---

### **Step 2: Firebase Console Configuration**

#### **2.1 Enable Google Authentication in Firebase**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project `devinquirecom`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Enable the toggle
6. **Web SDK configuration**:
   - Paste the **Client ID** from Step 1.4
   - Paste the **Client Secret** from Google Cloud Console
7. Click **Save**

#### **2.2 Configure Authorized Domains**
1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   ```
   localhost
   yourdomain.com
   devinquire.com
   ```

---

### **Step 3: Update Environment Configuration**

#### **3.1 Update .env.local File**
Replace the placeholder in your `.env.local` file:

```env
# Replace this line:
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# With your actual Client ID:
REACT_APP_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

#### **3.2 Verify Firebase Configuration**
Ensure your Firebase configuration is correct:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyArdCvkX7bDdp0EtwiFmvqOotkcQuY-cYY
REACT_APP_FIREBASE_AUTH_DOMAIN=devinquirecom.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=devinquirecom
```

---

### **Step 4: Test Configuration**

#### **4.1 Restart Development Server**
```bash
cd /Users/durgashankardasmangaraj/Downloads/devinquire/dashboard
npm start
```

#### **4.2 Test OAuth Configuration**
Run the Firebase configuration test:
```bash
node scripts/test-firebase-config.js
```

#### **4.3 Test Google Login**
1. Open your application at `http://localhost:3000`
2. Navigate to the login page
3. Click \"Continue with Google\"
4. You should be redirected to Google's OAuth consent screen

---

## 🔧 **Advanced Configuration**

### **Production Environment Setup**

For production deployment, create additional OAuth clients:

1. **Production OAuth Client** (Google Cloud Console):
   - Authorized origins: `https://yourdomain.com`
   - Redirect URIs: `https://yourdomain.com/auth/google/callback`

2. **Environment Variables for Production**:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
   REACT_APP_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
   ```

### **Security Best Practices**

1. **Domain Restrictions**:
   - Only add necessary domains to authorized origins
   - Use HTTPS in production

2. **Scope Limitations**:
   - Request only necessary scopes (`email`, `profile`, `openid`)
   - Avoid requesting excessive permissions

3. **Environment Separation**:
   - Use different OAuth clients for development, staging, and production
   - Never share production credentials

---

## 🐛 **Troubleshooting Common Issues**

### **Error: \"OAuth client not found\"**
- ✅ **Solution**: Verify the Client ID is correctly copied from Google Cloud Console
- ✅ **Check**: Ensure no extra spaces or characters in the environment variable

### **Error: \"redirect_uri_mismatch\"**
- ✅ **Solution**: Add the exact redirect URI to authorized redirect URIs in Google Cloud Console
- ✅ **Check**: Ensure the port number matches (3000, 3001, or 3002)

### **Error: \"Access blocked\"**
- ✅ **Solution**: Complete OAuth consent screen configuration
- ✅ **Check**: Add your email as a test user during development

### **Error: \"This app isn't verified\"**
- ✅ **Solution**: This is normal during development
- ✅ **Action**: Click \"Advanced\" → \"Go to DevInquire Dashboard (unsafe)\" for testing
- ✅ **Production**: Submit for verification once ready for production

---

## 📞 **Support**

If you continue to experience issues:

1. **Check Console Logs**: Open browser developer tools and look for detailed error messages
2. **Verify Configuration**: Run the test script to validate your setup
3. **Review Firebase Logs**: Check Firebase Console for authentication errors

---

## ✅ **Verification Checklist**

- [ ] Google Cloud Project created and APIs enabled
- [ ] OAuth client created with correct redirect URIs
- [ ] Firebase Authentication enabled with Google provider
- [ ] Environment variables updated with actual Client ID
- [ ] Development server restarted
- [ ] Test login successful

**Once all items are checked, your Google OAuth should work correctly!**"