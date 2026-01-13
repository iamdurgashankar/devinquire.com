# DevInquire Dashboard

A comprehensive web-based dashboard application for managing content, users, and real-time features. Built with React and Firebase integration.

## 🚀 Features

- **User Management**: Admin controls, user profiles, and permissions
- **Authentication**: Login, signup, OAuth integration, password change
- **Content Management**: Blog management, real-time blog feed
- **Page Builder**: Drag-and-drop interface using GrapesJS
- **Real-time Features**: Live demos and updates
- **Admin Dashboard**: Statistics, notifications, and system monitoring

## 🛠️ Technology Stack

### Frontend

- React 18.2.0
- TailwindCSS with plugins (forms, nesting)
- Framer Motion for animations
- GrapesJS with multiple plugins (blocks, export, forms, tabs)
- React DnD for drag-and-drop interactions
- React Quill for rich text editing

### Backend & Services

- Firebase (v11.9.1) for real-time database, auth, and cloud functions
- PHP scripts for authentication and session management
- Firebase Auth for secure authentication
- Google Generative AI API integration

### Third-party Integrations

- OAuth support for third-party login
- Axios for HTTP requests
- JWT for secure session handling

## 📋 Prerequisites

- Node.js v18+
- npm or yarn
- Firebase CLI for deployment
- PHP environment for backend testing (optional)

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/iamdurgashankar/devinquire-dashboard.git
   cd devinquire-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   - Copy `.env.example` to `.env.local`
   - Configure your Firebase settings
   - Update environment variables as needed

4. **Start development server**

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (one-way operation)

## 🏗️ Project Structure

```
src/
├── components/          # UI components
│   ├── admin/          # Admin-specific components
│   ├── BlogManager.jsx # Blog management interface
│   └── ...
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Top-level route components
├── services/           # API and business logic
├── utils/              # Helper functions
└── styles/             # CSS and theme files
```

## 🔥 Firebase Configuration

The application uses Firebase for:

- Authentication (Email/Password, OAuth)
- Real-time Database (Firestore)
- File Storage
- Cloud Functions
- Performance Monitoring
- Analytics

Refer to `ENV_CONFIGURATION_GUIDE.md` for detailed environment setup.

## 🔐 Security Features

- Enterprise-level Firebase security rules
- Role-based access control
- JWT token management
- File upload validation
- Real-time performance monitoring

## 📱 Key Components

### User Management

- Admin user controls
- User approval system
- Profile management
- Activity logging

### Content Management

- Blog post creation and editing
- Real-time blog feed
- Rich text editor with ReactQuill
- Image upload and management

### Page Builder

- Drag-and-drop interface
- GrapesJS integration
- Custom component library
- Export/import functionality

### Real-time Features

- Live blog updates
- Real-time notifications
- Connection status monitoring
- Auto-save functionality

## 🚀 Deployment

**For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Overview

#### Backend (Firebase)
```bash
# Deploy Firebase backend services
npm run deploy:prod
```

#### Frontend (Choose ONE)

**Option 1: Vercel (Recommended)**
- Connect your GitHub repository to Vercel
- Configure environment variables in Vercel dashboard
- Automatic deployment on push to main branch

**Option 2: Netlify (Alternative)**
- Connect your GitHub repository to Netlify
- Configure environment variables in Netlify dashboard
- Automatic deployment on push to main branch

### Development

```bash
npm start
```

### Production Build

```bash
npm run build
```

**⚠️ Important**: Choose EITHER Vercel OR Netlify for frontend deployment. Do not use both simultaneously. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Documentation

- `ENV_CONFIGURATION_GUIDE.md` - Environment setup guide
- `firebase/schema.md` - Firebase data structure
- Component documentation in respective files

## 🐛 Known Issues

- Some GrapesJS plugins may conflict with custom components
- Firebase rate limits may affect real-time features under heavy load
- PHP backend requires proper server configuration for sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@devinquire.com or create an issue in this repository.

## 🙏 Acknowledgments

- Built with Create React App
- Firebase for backend services
- GrapesJS for page building functionality
- TailwindCSS for styling

---

**DevInquire Dashboard** - Empowering content management with real-time capabilities.
