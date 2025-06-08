#!/bin/bash

# ScholarBridge LMS Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up ScholarBridge LMS..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads/profiles uploads/content uploads/logos uploads/temp
mkdir -p logs
mkdir -p nginx/ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before proceeding."
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec api npm run migrate

# Run database seeds
echo "🌱 Running database seeds..."
docker-compose exec api npm run seed

echo "✅ Setup complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Main Application: http://localhost"
echo "   Demo Institution: http://demo.localhost"
echo "   SuperAdmin: http://admin.localhost"
echo "   API Health: http://localhost:5000/health"
echo ""
echo "👤 Default Users:"
echo "   SuperAdmin: superadmin / SuperAdmin123! (admin.localhost)"
echo "   Admin: admin / Admin123! (demo.localhost)"
echo "   Faculty: faculty / Faculty123! (demo.localhost)"
echo "   Student: student / Student123! (demo.localhost)"
echo "   Librarian: librarian / Librarian123! (demo.localhost)"
echo ""
echo "📚 Next Steps:"
echo "   1. Update .env file with your configuration"
echo "   2. Configure your hosts file for local subdomains:"
echo "      127.0.0.1 demo.localhost"
echo "      127.0.0.1 admin.localhost"
echo "   3. Access the application at http://demo.localhost"
echo ""
echo "🛠️  Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Reset database: docker-compose down -v && docker-compose up -d"