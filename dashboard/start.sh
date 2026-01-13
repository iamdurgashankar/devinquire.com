#!/bin/bash

# DevInquire Dashboard Startup Script
# Firebase-powered React application

echo "🚀 Starting DevInquire Dashboard (Firebase Backend)..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js to run the application"
    exit 1
fi

# Check if Firebase configuration exists
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "⚠️  Firebase configuration not found"
    echo "Please copy .env.example to .env.local and configure your Firebase settings"
    echo "See ENV_CONFIGURATION_GUIDE.md for detailed setup instructions"
fi

# Start React development server with Firebase backend
echo "⚛️  Starting React Frontend Server with Firebase Backend..."
echo "📱 Application will be available at: http://localhost:3000"
echo "🔥 Backend: Firebase (Firestore + Auth + Functions)"
echo ""
echo "🔑 Authentication:"
echo "   • Email/Password registration and login"
echo "   • Google OAuth integration"
echo "   • GitHub OAuth integration"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start React development server
npm start

echo ""
echo "✅ Application stopped"