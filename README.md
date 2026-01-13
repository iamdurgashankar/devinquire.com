# DevInquire - Complete Project

**A modern web platform with Dashboard for content management and public website for content display.**

---

## 🚀 Quick Start

**Want to deploy quickly?** See **[SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md)** for step-by-step instructions.

---

## 📁 Project Structure

```
.
├── dashboard/          # Content management dashboard (React + Firebase)
├── devinquire.com/     # Public website (React + PHP/MySQL)
├── COMPLETE_SETUP_GUIDE.md    # Detailed setup instructions
├── SIMPLE_DEPLOYMENT_GUIDE.md # Quick deployment guide
└── FIREBASE_CONFIG.md          # Firebase configuration reference
```

---

## 🎯 What This Project Includes

### Dashboard (`dashboard/`)
- **Technology**: React + Firebase
- **Purpose**: Content management system for creating blog posts
- **Features**:
  - Firebase Authentication (Email, Google, GitHub)
  - Blog post creation and management
  - User management with RBAC
  - Real-time updates
  - Offline support

### Public Website (`devinquire.com/`)
- **Technology**: React + PHP + MySQL
- **Purpose**: Public-facing website displaying blog posts
- **Features**:
  - Blog post display
  - Category filtering
  - Contact forms
  - Newsletter subscriptions
  - SEO optimized

---

## ⚙️ Configuration

### Dashboard Configuration

1. **Copy environment example:**
   ```bash
   cd dashboard
   cp env.example .env.local
   ```

2. **Fill in Firebase credentials** in `.env.local`:
   - Get from Firebase Console → Project Settings → General
   - All `REACT_APP_FIREBASE_*` variables

3. **For production build:**
   ```bash
   cp env.production.example .env.production
   # Edit .env.production with same values
   npm run build
   ```

See `dashboard/SETUP_CONFIG.md` for detailed instructions.

### devinquire.com Configuration

1. **Copy environment example:**
   ```bash
   cp devinquire.com.env.example devinquire.com/.env
   ```

2. **Fill in configuration** in `.env`:
   - Database credentials (from Hostinger)
   - Firebase Project ID
   - API keys
   - Email settings (SMTP)

3. **Build and deploy:**
   ```bash
   cd devinquire.com
   npm install
   npm run build
   # Upload build/ and api/ folders to Hostinger
   ```

---

## 🔄 How It Works

```
┌─────────────────┐
│   Dashboard     │  Create blog posts here
│  (Firebase)     │
└────────┬────────┘
         │
         │ Posts saved to Firebase
         ▼
┌─────────────────┐
│  Firebase       │  Posts stored here
│  Firestore      │
└────────┬────────┘
         │
         │ Sync script runs every 5 min
         ▼
┌─────────────────┐
│  Sync Script    │  Copies posts from Firebase
│  (Cron Job)     │  to MySQL
└────────┬────────┘
         │
         │ Posts synced to MySQL
         ▼
┌─────────────────┐
│  MySQL Database │  Posts stored here
│  (Hostinger)    │
└────────┬────────┘
         │
         │ Website reads from MySQL
         ▼
┌─────────────────┐
│  devinquire.com │  Posts displayed here
│  (Blog Page)    │
└─────────────────┘
```

---

## 📚 Documentation

- **[HOSTINGER_DEPLOYMENT_GUIDE.md](./HOSTINGER_DEPLOYMENT_GUIDE.md)** - **Complete deployment guide for Hostinger shared hosting** ⭐
- **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** - Detailed setup instructions
- **[SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md)** - Quick deployment reference
- **[dashboard/SETUP_CONFIG.md](./dashboard/SETUP_CONFIG.md)** - Dashboard configuration
- **[FIREBASE_CONFIG.md](./FIREBASE_CONFIG.md)** - Firebase setup reference
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Deployment checklist

---

## 🛠️ Development

### Dashboard Development

```bash
cd dashboard
npm install
npm start
# Runs on http://localhost:3000
```

### devinquire.com Development

```bash
cd devinquire.com
npm install
npm start
# Frontend runs on http://localhost:3000

# In another terminal:
cd api
php -S localhost:8000
# API runs on http://localhost:8000
```

---

## 🚀 Deployment

**For complete step-by-step deployment instructions, see:**
- **[HOSTINGER_DEPLOYMENT_GUIDE.md](./HOSTINGER_DEPLOYMENT_GUIDE.md)** - Complete guide for deploying both Dashboard and devinquire.com to Hostinger shared hosting

### Quick Overview

**Dashboard Deployment:**
- Build: `npm run build` in `dashboard/` folder
- Deploy to Firebase Hosting, Vercel, or Netlify
- Configure Firebase environment variables

**devinquire.com Deployment:**
- Build: `npm run build` in `devinquire.com/` folder
- Upload `build/` and `api/` folders to Hostinger `public_html/`
- Configure database and set up cron job for sync script

See **[HOSTINGER_DEPLOYMENT_GUIDE.md](./HOSTINGER_DEPLOYMENT_GUIDE.md)** for detailed instructions.

---

## ✅ Configuration Checklist

### Dashboard
- [ ] Firebase project created
- [ ] `.env.local` configured with Firebase credentials
- [ ] `.env.production` configured (for production builds)
- [ ] Dashboard builds successfully
- [ ] Authentication works

### devinquire.com
- [ ] `.env` file created with database credentials
- [ ] Database schema imported
- [ ] Firebase Project ID configured
- [ ] Frontend builds successfully
- [ ] Files uploaded to Hostinger
- [ ] Database connection works
- [ ] Firebase Firestore rules allow public read
- [ ] Cron job set up for sync script
- [ ] Sync script tested manually

---

## 🐛 Troubleshooting

### Dashboard Issues
- **Firebase not connecting?** Check `.env.local` has correct values
- **Build failing?** Verify all environment variables are set
- **Authentication not working?** Check Firebase Authentication is enabled

### devinquire.com Issues
- **Database connection failed?** Check `.env` file credentials
- **Posts not syncing?** Check Firestore rules and cron job
- **Sync script errors?** Check `api/sync.log` file

See troubleshooting sections in the detailed guides for more help.

---

## 📝 Environment Variables Reference

### Dashboard (`dashboard/.env.local` or `.env.production`)
```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

### devinquire.com (`devinquire.com/.env`)
```env
DB_HOST=localhost
DB_NAME=...
DB_USERNAME=...
DB_PASSWORD=...
FIREBASE_PROJECT_ID=...
FIREBASE_WEB_API_KEY=...
BLOG_API_KEY=...
SMTP_HOST=...
SMTP_USERNAME=...
SMTP_PASSWORD=...
```

---

## 🎉 You're All Set!

Once configured, both Dashboard and devinquire.com will work together:
- ✅ Create posts in Dashboard → Saved to Firebase
- ✅ Sync script copies to MySQL automatically
- ✅ Website displays posts from MySQL

**Happy deploying!** 🚀

