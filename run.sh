#!/bin/bash

# KARAN AI Digital Twin - Deployment Script
# This script sets up and runs the AI Digital Twin system

echo "🤖 KARAN AI Digital Twin System"
echo "================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.12+ first."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)"; then
    echo "✅ Python $PYTHON_VERSION detected"
else
    echo "❌ Python $PYTHON_VERSION detected. Please upgrade to Python 3.12+"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if API key is configured
echo ""
echo "🔑 Checking API configuration..."
if grep -q "AIzaSyAR5cGGRFXGziNjoMsuMHapf1I3PTtz0QQ" main.py; then
    echo "⚠️  WARNING: Default API key detected in main.py"
    echo "   Please replace with your own Google Gemini API key"
    echo "   Get one at: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting deployment. Please configure your API key first."
        exit 1
    fi
else
    echo "✅ API key appears to be configured"
fi

# Start the servers
echo ""
echo "🚀 Starting servers..."
echo "   Backend API: http://localhost:8000"
echo "   Frontend UI: http://localhost:8080"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting FastAPI backend..."
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
python -m http.server 8080 &
FRONTEND_PID=$!

# Wait for backend to be ready
echo "Waiting for servers to be ready..."
sleep 2

# Check if servers are running
if kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; then
    echo ""
    echo "🎉 System is live!"
    echo "   🌐 Open your browser and go to: http://localhost:8080"
    echo "   🎤 Click 'Initialize Voice Link' to start voice interaction"
    echo ""
    echo "Press Ctrl+C to stop the servers"
    wait
else
    echo "❌ Failed to start servers"
    cleanup
fi