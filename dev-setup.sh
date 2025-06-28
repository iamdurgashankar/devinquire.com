#!/bin/bash

# DevInquire Development Setup Script
echo "🚀 Starting DevInquire Development Environment..."

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $PHP_PID $REACT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start PHP server in background
echo "🌐 Starting PHP API server on http://localhost:8000..."
php -S localhost:8000 -t api &
PHP_PID=$!

# Wait a moment for PHP server to start
sleep 2

# Start React development server
echo "⚛️  Starting React development server on http://localhost:3000..."
npm start &
REACT_PID=$!

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:8000"
echo ""
echo "Default admin credentials:"
echo "Email: admin@devinquire.com"
echo "Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait 