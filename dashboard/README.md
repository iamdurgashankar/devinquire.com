# DevInquire Dashboard

This is a standalone dashboard application for DevInquire, designed to be deployed as a separate application on `dashboard.devinquire.com`.

## Features

- **Admin Dashboard**: Complete admin interface for managing content
- **Blog Management**: Create, edit, and publish blog posts
- **Page Management**: Build and manage website pages
- **User Management**: Manage users and permissions
- **Analytics**: Dashboard statistics and insights

## Project Structure

```
dashboard/
├── public/
│   ├── index.html          # Dashboard-specific HTML
│   ├── .htaccess          # Apache configuration
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Dashboard components
│   │   ├── AdminDashboard.jsx
│   │   ├── BlogManager.jsx
│   │   ├── PageManager.jsx
│   │   ├── UserManager.jsx
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── pages/             # Dashboard pages
│   │   ├── Admin.jsx
│   │   └── Login.jsx
│   ├── services/          # API services
│   │   └── api.js
│   ├── styles/            # CSS styles
│   ├── config.js          # Configuration
│   ├── App.js             # Main app component
│   └── index.js           # Entry point
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
└── postcss.config.js      # PostCSS configuration
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Building for Production

```bash
npm run build
```

This creates a `build` folder with the production-ready files.

## Deployment

### Automatic Deployment

The dashboard is automatically deployed when changes are pushed to the `dashboard/` folder via GitHub Actions.

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `build` folder to your dashboard subdomain directory.

### Environment Configuration

- **Development**: API calls go to `http://localhost:8000`
- **Production**: API calls go to `https://devinquire.com/api`

## API Integration

The dashboard communicates with the main DevInquire API located at:
- Local: `http://localhost:8000`
- Production: `https://devinquire.com/api`

All API endpoints are shared with the main application, ensuring data consistency.

## Routes

- `/` - Main dashboard
- `/page-manager` - Page management interface
- `/page-builder` - Page builder tool
- `/page-builder/:pageId` - Edit specific page
- `/login` - Authentication

## Security

- CORS headers configured for cross-domain API calls
- Security headers for XSS and clickjacking protection
- Secure authentication flow
- Protected routes requiring admin access

## Customization

### Styling

- Uses Tailwind CSS for styling
- Custom styles in `src/styles/`
- Theme support via ThemeContext

### Configuration

Modify `src/config.js` to change:
- API endpoints
- Application settings
- Environment-specific configurations

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure the main API is running
   - Check CORS configuration
   - Verify API_BASE in config.js

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check for missing dependencies
   - Ensure Node.js version compatibility

3. **Authentication Issues**
   - Verify session configuration
   - Check cookie settings
   - Ensure proper CORS headers

### Support

For issues or questions, refer to the main project documentation or create an issue in the repository.

## License

This project is part of the DevInquire platform and follows the same licensing terms.