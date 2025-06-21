# Devinquire Agency Web Application

A modern full-stack agency web application for website development, web applications, component development, mobile applications, SEO services, logo/banner design, and a dynamic blog section.

## 🚀 Live Demo

Visit [devinquire.com](https://devinquire.com) to see the live application.

## ✨ Features

- **Agency Services**: Complete showcase of development services
- **Dynamic Blog**: Content management with image upload capabilities
- **Admin Dashboard**: Full admin interface for blog management
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Authentication**: Firebase-based user authentication
- **Modern UI**: Beautiful animations with Framer Motion
- **RESTful API**: Clean Node.js backend with Express

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Framer Motion** - Animation library
- **Firebase** - Authentication and backend services

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Deployment

- **GitHub Actions** - Continuous deployment
- **Hostinger** - Web hosting with custom domain

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 🌐 Deployment

This project is configured for automatic deployment to devinquire.com using GitHub Actions and Hostinger.

### Quick Setup:

1. **Push to GitHub**: Upload your code to a GitHub repository
2. **Configure Hostinger**: Follow the [Hostinger Setup Guide](./HOSTINGER_SETUP.md)
3. **Set Secrets**: Add required FTP credentials to GitHub Secrets
4. **Deploy**: Push to main branch triggers automatic deployment

For detailed deployment instructions, see [HOSTINGER_SETUP.md](./HOSTINGER_SETUP.md).

## 🔧 Environment Variables

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### Backend (.env)

```
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret
```

## 📁 Project Structure

```
devinquire/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── firebase.js        # Firebase configuration
├── backend/               # Node.js backend
│   ├── routes/           # API routes
│   ├── uploads/          # File uploads
│   ├── blogData.js       # In-memory data storage
│   └── index.js          # Server entry point
├── public/               # Static assets
├── .github/              # GitHub Actions workflows
├── scripts/              # Deployment scripts
└── docs/                 # Documentation
```

## 🔄 Continuous Deployment

The project uses GitHub Actions for automatic deployment:

- **Frontend**: Deploys on changes to `src/`, `public/`, or `package.json`
- **Backend**: Deploys on changes to `backend/` directory
- **Domain**: Automatically updates devinquire.com

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests

# Backend
cd backend
npm run dev        # Start development server
npm start          # Start production server
```

### API Endpoints

```
GET    /api/health          # Health check
GET    /api/blog            # Get all blog posts
GET    /api/blog/:id        # Get single blog post
POST   /api/blog            # Create new blog post
PUT    /api/blog/:id        # Update blog post
DELETE /api/blog/:id        # Delete blog post
```

### Code Style

- **Frontend**: ESLint + Prettier
- **Backend**: Standard JavaScript
- **CSS**: Tailwind CSS utility classes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [HOSTINGER_SETUP.md](./HOSTINGER_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/devinquire/issues)
- **Email**: support@devinquire.com

## 🎯 Roadmap

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Advanced admin features
- [ ] SEO optimization
- [ ] Performance monitoring
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Social media integration

## 🔧 Recent Changes

### v1.1.0 - Project Cleanup

- ✅ Removed unused PHP files and configurations
- ✅ Cleaned up mixed backend technologies
- ✅ Improved Node.js backend structure
- ✅ Enhanced error handling and validation
- ✅ Streamlined deployment configuration
- ✅ Removed security vulnerabilities (exposed credentials)

---

**Built with ❤️ by the Devinquire Team**
# Updated for deployment
