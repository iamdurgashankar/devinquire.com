# DevInquire - Development Agency Website

A modern web application for a development agency with user authentication, admin panel, and blog management.

## Features

- **User Authentication**: Login/Register with role-based access
- **Admin Panel**: User management, blog management, and dashboard
- **Responsive Design**: Modern UI with Tailwind CSS
- **Blog System**: Create, edit, and manage blog posts
- **User Management**: Approve/reject new user registrations

## Prerequisites

- Node.js (v14 or higher)
- PHP (v7.4 or higher) - for local API development
- MySQL database (for production)

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd devinquire
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install PHP (if not already installed)

#### macOS:

```bash
# Using Homebrew
brew install php

# Or using MAMP/XAMPP
# Download from https://www.mamp.info/ or https://www.apachefriends.org/
```

#### Windows:

```bash
# Download from https://windows.php.net/download/
# Or use XAMPP: https://www.apachefriends.org/
```

#### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install php php-cli php-common
```

### 4. Database Setup

#### For Local Development:

The application uses localStorage for local development, so no database setup is required.

#### For Production:

1. Create a MySQL database
2. Update the database configuration in `api/db.php`
3. Import the database schema (if provided)

### 5. Environment Configuration

The application automatically detects the environment:

- **Development**: Uses `http://localhost:8000/api`
- **Production**: Uses `https://devinquire.com/api`

## Running the Application

### Option 1: Quick Start (Recommended)

Use the provided setup scripts:

#### macOS/Linux:

```bash
./dev-setup.sh
```

#### Windows:

```bash
dev-setup.bat
```

### Option 2: Manual Setup

#### Local Development

1. **Start the PHP API server** (in one terminal):

```bash
npm run server
```

This starts a PHP server on `http://localhost:8000` serving the API files.

2. **Start the React development server** (in another terminal):

```bash
npm start
```

This starts the React app on `http://localhost:3000`.

3. **Access the application**:

- Frontend: http://localhost:3000
- API: http://localhost:8000/api

### Option 3: Frontend Only (No PHP Required)

If you don't have PHP installed or want to test just the frontend:

1. **Start only the React development server**:

```bash
npm start
```

2. **The application will work with mock data** and localStorage for authentication.

### Production

1. **Build the React application**:

```bash
npm run build
```

2. **Deploy the files**:

- Upload the `build` folder contents to your web server
- Upload the `api` folder to your server's API directory
- Ensure the API base URL in `src/services/api.js` points to your production domain

## Default Admin Credentials

For local development, the default admin credentials are:

- **Email**: admin@devinquire.com
- **Password**: admin123

## API Endpoints

The application includes the following API endpoints:

- `POST /api/login.php` - User login
- `POST /api/signup.php` - User registration
- `GET /api/session.php` - Get current session
- `POST /api/logout.php` - User logout
- `GET /api/get_users.php` - Get all users (admin)
- `POST /api/delete_user.php` - Delete user (admin)
- `GET /api/get_pending_users.php` - Get pending users (admin)
- `POST /api/approve_user.php` - Approve user (admin)
- `POST /api/reject_user.php` - Reject user (admin)
- `GET /api/profile.php` - Get user profile
- `POST /api/profile.php` - Update user profile

## Project Structure

```
devinquire/
├── api/                 # PHP API files
├── public/             # Static files
├── src/                # React source code
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── pages/          # Page components
│   └── services/       # API services
├── package.json        # Node.js dependencies
├── dev-setup.sh        # Development setup script (macOS/Linux)
├── dev-setup.bat       # Development setup script (Windows)
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **PHP not found**: Install PHP using the instructions above
2. **API Connection Error**: Make sure the PHP server is running on port 8000
3. **CORS Issues**: The PHP server includes CORS headers for local development
4. **Login Not Working**: Check that the API endpoints are accessible

### Reset Database (Local Development)

If you need to reset the local database:

1. Open the browser console
2. Run: `localStorage.clear()`
3. Refresh the page

Or use the reset button in the admin panel.

### Port Already in Use

If port 8000 is already in use:

```bash
# Find the process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License.
