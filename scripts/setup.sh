#!/bin/bash

# Vixter Migration Setup Script
echo "🚀 Setting up Vixter Next.js migration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env with your actual environment variables"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Check if DATABASE_URL is set
if grep -q "your-database-url" .env; then
    echo "⚠️  Please update DATABASE_URL in .env with your Neon PostgreSQL connection string"
else
    echo "🗄️  Running database migrations..."
    npx prisma db push
    
    echo "🌱 Seeding database..."
    npm run db:seed
fi

# Start development services
echo "🐳 Starting development services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Centrifugo is running"
else
    echo "⚠️  Centrifugo may not be ready yet"
fi

if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL may not be ready yet"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your actual environment variables"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000 to see your app"
echo ""
echo "Services:"
echo "- Next.js app: http://localhost:3000"
echo "- Centrifugo admin: http://localhost:8000"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo ""
echo "Useful commands:"
echo "- npm run dev: Start development server"
echo "- npm run db:studio: Open Prisma Studio"
echo "- docker-compose logs: View service logs"
echo "- docker-compose down: Stop services"
