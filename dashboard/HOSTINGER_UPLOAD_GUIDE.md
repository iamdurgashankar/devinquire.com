# Hostinger Shared Hosting Deployment Guide

This guide explains how to deploy your **React + PHP (Hybrid)** dashboard to Hostinger Shared Hosting.

## 📂 Deployment Architecture

- **Frontend (React)**: Static files (HTML, CSS, JS) served from the root (`public_html`).
- **Backend (PHP)**: API endpoints served from a subdirectory (`public_html/api`).
- **Database**: Firestore (Managed by Google, accessed via PHP and Frontend).

## 🚀 Step 1: Prepare the Build

We have created a script to automate the packaging of your application.

1. Open your terminal in the project root.
2. Run the preparation script:
   ```bash
   chmod +x scripts/prepare-hostinger.sh
   ./scripts/prepare-hostinger.sh
   ```
3. This will create a folder named `hostinger_deploy` containing everything you need.

## 📤 Step 2: Upload to Hostinger

1. Log in to your **Hostinger hPanel**.
2. Go to **File Manager**.
3. Navigate to `public_html`.
4. **Delete** default files (like `default.php`) if present.
5. **Upload** the contents of the `hostinger_deploy` folder to `public_html`.
   - The `index.html` and other React files should be directly in `public_html`.
   - You should see an `api` folder inside `public_html`.

## ⚙️ Step 3: Configure Environment

1. In File Manager, navigate to `public_html/api`.
2. Look for the `.env` file.
3. Right-click and **Edit**.
4. Paste your production Firebase credentials:
   ```env
   FIREBASE_PROJECT_ID=your-actual-project-id
   FIREBASE_WEB_API_KEY=your-actual-api-key
   ```
   *(You can find these in your local `.env` or Firebase Console)*.
5. Save the file.

## ✅ Step 4: Verify Deployment

1. **Frontend**: Visit `yourdomain.com`. You should see the login screen.
2. **Backend**: Visit `yourdomain.com/api/health`. You should see:
   ```json
   {"status":"healthy", ...}
   ```

## 🔧 Troubleshooting

- **404 on Refresh**: Ensure the `.htaccess` file (which handles React Router) was uploaded to `public_html`.
- **API Errors**: Check `public_html/api/error_log` (if enabled) or ensure `public_html/api/.env` has correct credentials.
- **Permissions**: Ensure folders are set to `755` and files to `644`.

## 🔄 Updates

To update your site later:
1. Run `./scripts/prepare-hostinger.sh` locally.
2. Re-upload the files.
   - For **Frontend changes**: Upload everything *except* the `api` folder.
   - For **Backend changes**: Upload only the `api` folder (preserve `.env`).
