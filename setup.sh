#!/bin/bash

# College Organizer - Quick Start Script

echo "🎓 College Organizer - Setup Script"
echo "===================================="
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your MongoDB URI and JWT_SECRET"
fi

echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend setup complete"
else
    echo "❌ Backend setup failed"
    exit 1
fi

# Return to root
cd ..

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd frontend
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend setup complete"
else
    echo "❌ Frontend setup failed"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MongoDB connection string"
echo "2. Run: npm run dev:backend   (in one terminal)"
echo "3. Run: npm run dev:frontend  (in another terminal)"
echo "4. Visit: http://localhost:3000"
echo ""
echo "To seed demo data:"
echo "  cd backend && npm run seed"
echo ""
