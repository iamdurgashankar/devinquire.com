# DevInquire Backend API

A robust Node.js/Express backend API server for the DevInquire blog platform with Firebase integration, providing authentication, content management, email services, and analytics.

## 🚀 Features

- **Firebase Integration**: Complete Firebase Admin SDK setup with Authentication, Firestore, Realtime Database, and Storage
- **RESTful API**: Well-structured REST endpoints for all platform features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Email Services**: Contact forms, newsletters, and automated email campaigns
- **Real-time Comments**: Live commenting system using Firebase Realtime Database
- **Analytics**: Comprehensive tracking and reporting system
- **Security**: Rate limiting, CORS, input validation, and security headers
- **File Upload**: Image and document upload with validation and processing
- **Caching**: Redis-based caching for improved performance
- **Monitoring**: Health checks, logging, and error tracking
- **Testing**: Comprehensive test suite with coverage reporting
- **Documentation**: Auto-generated API documentation with Swagger

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Firebase project with Admin SDK credentials
- Redis server (optional, for caching)
- Gmail account or SMTP server (for email services)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/devinquire/devinquire.com.git
   cd devinquire.com/src/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration values.

4. **Firebase Setup**
   
   **Option A: Service Account Key File**
   - Download your Firebase service account key from Firebase Console
   - Save it as `serviceAccountKey.json` in the backend root directory
   - Set `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json` in `.env`
   
   **Option B: Environment Variables**
   - Set all Firebase configuration variables in `.env` file
   - This is recommended for production deployments

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Required Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Security
JWT_SECRET=your-jwt-secret
API_KEY=your-api-key

# CORS
CORS_ORIGIN=http://localhost:3000,https://devinquire.com
```

### Firebase Service Account Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Either:
   - Save as `serviceAccountKey.json` in backend root, OR
   - Extract values to environment variables in `.env`

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.devinquire.com/api
```

### Authentication
Most endpoints require authentication via Firebase ID token:
```
Authorization: Bearer <firebase-id-token>
```

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /verify-token` - Verify Firebase ID token
- `POST /custom-token` - Create custom token
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /set-claims` - Set custom user claims (admin)
- `DELETE /user/:uid` - Delete user account (admin)

#### Users (`/api/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /posts` - Get user's posts
- `GET /activity` - Get user activity
- `PUT /preferences` - Update user preferences

#### Posts (`/api/posts`)
- `GET /` - Get all posts (with filtering, sorting, pagination)
- `GET /:id` - Get single post by ID
- `POST /` - Create new post (auth required)
- `PUT /:id` - Update post (auth + ownership required)
- `DELETE /:id` - Delete post (auth + ownership required)
- `POST /:id/like` - Like/unlike post
- `GET /categories` - Get all categories
- `GET /tags` - Get all tags

#### Comments (`/api/comments`)
- `GET /:postId` - Get comments for post
- `POST /:postId` - Add comment to post
- `PUT /:commentId` - Update comment
- `DELETE /:commentId` - Delete comment
- `POST /:commentId/like` - Like/unlike comment
- `POST /:commentId/reply` - Reply to comment

#### Email (`/api/email`)
- `POST /contact` - Submit contact form
- `GET /contact` - Get contact submissions (admin)
- `PUT /contact/:id` - Update contact submission (admin)
- `POST /send` - Send custom email (admin)
- `GET /test` - Test email configuration

#### Newsletter (`/api/newsletter`)
- `POST /subscribe` - Subscribe to newsletter
- `POST /unsubscribe` - Unsubscribe from newsletter
- `PUT /preferences` - Update subscription preferences
- `POST /campaign` - Send newsletter campaign (admin)
- `GET /stats` - Get newsletter statistics (admin)

#### Analytics (`/api/analytics`)
- `POST /pageview` - Track page view
- `POST /event` - Track custom event
- `GET /overview` - Get analytics overview (admin)
- `GET /pages/:page` - Get page-specific analytics (admin)
- `GET /events/:event` - Get event-specific analytics (admin)
- `GET /realtime` - Get real-time analytics (admin)

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Generate coverage report
npm test -- --coverage

# Run Firebase-specific tests
npm run firebase:test
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application
npm start

# Monitor processes
npm run monitor

# View logs
npm run logs

# Restart application
npm run restart
```

### Docker Deployment
```bash
# Build image
docker build -t devinquire-backend .

# Run container
docker run -p 5000:5000 --env-file .env devinquire-backend
```

### Firebase Functions Deployment
```bash
# Deploy to Firebase Functions
npm run firebase:deploy

# Deploy specific function
firebase deploy --only functions:api
```

## 📁 Project Structure

```
src/backend/
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management routes
│   ├── posts.js         # Blog post routes
│   ├── comments.js      # Comment system routes
│   ├── email.js         # Email service routes
│   ├── newsletter.js    # Newsletter routes
│   └── analytics.js     # Analytics routes
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── index.js         # General middleware
├── services/
│   ├── firebaseAdmin.js # Firebase Admin SDK setup
│   ├── emailService.js  # Email service configuration
│   └── newsletterService.js # Newsletter service
├── tests/
│   ├── integration/     # Integration tests
│   ├── unit/           # Unit tests
│   └── setup.js        # Test setup
├── scripts/
│   ├── deploy-firebase.js # Deployment script
│   └── run-firebase-tests.js # Test runner
├── logs/               # Application logs
├── uploads/            # File uploads
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
└── README.md          # This file
```

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Joi-based request validation
- **SQL Injection Prevention**: Parameterized queries and sanitization
- **XSS Protection**: Input sanitization and output encoding
- **Security Headers**: Helmet.js for security headers
- **Authentication**: Firebase ID token verification
- **Authorization**: Role-based access control
- **File Upload Security**: Type validation and size limits

## 📊 Monitoring & Logging

- **Winston Logging**: Structured logging with rotation
- **Health Checks**: `/health` endpoint for monitoring
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Request timing and resource usage
- **Firebase Analytics**: Built-in analytics integration

## 🔧 Development Tools

```bash
# Code formatting
npm run format

# Linting
npm run lint
npm run lint:fix

# API documentation
open http://localhost:5000/api-docs

# Health check
npm run health
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify service account key path
   - Check Firebase project ID
   - Ensure proper permissions

2. **Email Service Issues**
   - Verify SMTP credentials
   - Check Gmail app password
   - Confirm firewall settings

3. **CORS Errors**
   - Update `CORS_ORIGIN` in `.env`
   - Check frontend URL configuration

4. **Rate Limiting**
   - Adjust rate limit settings
   - Check IP whitelist

### Debug Mode
```bash
DEBUG=devinquire:* npm run dev
```

### Logs Location
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [API Docs](http://localhost:5000/api-docs)
- **Issues**: [GitHub Issues](https://github.com/devinquire/devinquire.com/issues)
- **Email**: support@devinquire.com

## 🔄 Version History

- **v1.0.0**: Initial release with Firebase integration
- **v1.1.0**: Added newsletter and analytics features
- **v1.2.0**: Enhanced security and performance optimizations

---

**Built with ❤️ by the DevInquire Team**