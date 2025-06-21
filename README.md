# Devinquire Agency Web Application

A modern React-based agency web application for website development, web applications, component development, mobile applications, SEO services, logo/banner design, and a dynamic blog section.

## 🚀 Live Demo

Visit [devinquire.com](https://devinquire.com) to see the live application.

## ✨ Features

- **Agency Services**: Complete showcase of development services
- **Dynamic Blog**: Content management with mock data
- **Admin Dashboard**: Full admin interface for blog management
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Authentication**: Mock authentication system
- **Modern UI**: Beautiful animations with Framer Motion

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Framer Motion** - Animation library

### Deployment

- **GitHub Actions** - Continuous deployment
- **Hostinger** - Web hosting with custom domain

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🌐 Deployment

This project is configured for automatic deployment to devinquire.com using GitHub Actions and Hostinger.

### Quick Setup:

1. **Push to GitHub**: Upload your code to a GitHub repository
2. **Configure Hostinger**: Add FTP credentials to GitHub Secrets
3. **Deploy**: Push to main branch triggers automatic deployment

## 🔧 Environment Variables

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3000
```

## 📁 Project Structure

```
devinquire/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # Mock API services
│   └── firebase.js        # Firebase configuration
├── public/               # Static assets
├── .github/              # GitHub Actions workflows
└── README.md             # Documentation
```

## 🔄 Continuous Deployment

The project uses GitHub Actions for automatic deployment:

- **Frontend**: Deploys on changes to `src/`, `public/`, or `package.json`
- **Domain**: Automatically updates devinquire.com

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Mock Data

The application uses mock data for demonstration purposes:

- **Authentication**: Mock login/register system
- **Blog Posts**: Sample blog posts with categories
- **Admin Dashboard**: Mock statistics and user management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/devinquire/issues)
- **Email**: support@devinquire.com

## 🎯 Roadmap

- [ ] Real backend integration
- [ ] Database integration
- [ ] Advanced admin features
- [ ] SEO optimization
- [ ] Performance monitoring
- [ ] Analytics integration
- [ ] Multi-language support

## 🔧 Recent Changes

### v2.0.0 - Simplified Deployment

- ✅ Removed backend complexity
- ✅ Simplified to static React deployment
- ✅ Mock data for demonstration
- ✅ Clean GitHub Actions workflow
- ✅ Optimized for Hostinger hosting

---

**Built with ❤️ by the Devinquire Team**
