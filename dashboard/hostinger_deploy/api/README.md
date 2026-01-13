# DevInquire Dashboard - Simplified PHP Backend

A minimal PHP backend for Firebase token verification, optimized for Hostinger shared hosting.

## 🎯 Purpose

This backend provides essential API endpoints for:
- Firebase ID token verification
- Health checks
- Authentication status

**Note**: Most functionality is handled directly by Firebase in the frontend. This backend is minimal and only provides token verification when needed.

## 📦 Dependencies

- PHP 7.4 or higher
- Composer dependencies:
  - `firebase/php-jwt` - JWT token verification
  - `guzzlehttp/guzzle` - HTTP client for Firebase public keys

## 🚀 Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   composer install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

3. **Run development server**:
   ```bash
   composer run serve
   # Or: php -S localhost:8000 index.php
   ```

4. **Test endpoints**:
   ```bash
   curl http://localhost:8000/api/health
   ```

### Production Deployment

See [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Structure

```
backend/
├── index.php              # Main entry point
├── .htaccess              # Apache configuration
├── .env.example           # Environment template
├── composer.json          # Dependencies
├── config/
│   └── firebase.php       # Firebase configuration
├── controllers/
│   └── AuthController.php  # Authentication endpoints
└── middleware/
    └── AuthMiddleware.php # Auth middleware
```

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```

### Verify Token
```
POST /api/auth/verify
Content-Type: application/json

{
  "idToken": "firebase-id-token"
}
```

### Auth Status
```
GET /api/auth/status
```

## ⚙️ Configuration

Set environment variables in `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
```

## 🔒 Security

- `.env` file is protected by `.htaccess`
- Token verification uses Firebase public keys
- CORS can be configured in `index.php`
- Error reporting disabled in production

## 📝 Notes

- This is a **simplified** backend - most features are handled by Firebase
- Optimized for shared hosting (no shell access required)
- Minimal dependencies for faster deployment
- No database required - uses Firebase directly

## 🆘 Troubleshooting

See [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md) for troubleshooting guide.

