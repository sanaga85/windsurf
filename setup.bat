@echo off
echo 🚀 Setting up ScholarBridge LMS...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "uploads\profiles" mkdir uploads\profiles
if not exist "uploads\content" mkdir uploads\content
if not exist "uploads\logos" mkdir uploads\logos
if not exist "uploads\temp" mkdir uploads\temp
if not exist "logs" mkdir logs
if not exist "nginx\ssl" mkdir nginx\ssl

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating environment file...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your configuration before proceeding.
)

REM Build and start services
echo 🐳 Building and starting Docker services...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Run database migrations
echo 🗄️  Running database migrations...
docker-compose exec api npm run migrate

REM Run database seeds
echo 🌱 Running database seeds...
docker-compose exec api npm run seed

echo ✅ Setup complete!
echo.
echo 🌐 Application URLs:
echo    Main Application: http://localhost
echo    Demo Institution: http://demo.localhost
echo    SuperAdmin: http://admin.localhost
echo    API Health: http://localhost:5000/health
echo.
echo 👤 Default Users:
echo    SuperAdmin: superadmin / SuperAdmin123! (admin.localhost)
echo    Admin: admin / Admin123! (demo.localhost)
echo    Faculty: faculty / Faculty123! (demo.localhost)
echo    Student: student / Student123! (demo.localhost)
echo    Librarian: librarian / Librarian123! (demo.localhost)
echo.
echo 📚 Next Steps:
echo    1. Update .env file with your configuration
echo    2. Configure your hosts file for local subdomains:
echo       127.0.0.1 demo.localhost
echo       127.0.0.1 admin.localhost
echo    3. Access the application at http://demo.localhost
echo.
echo 🛠️  Useful Commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    Reset database: docker-compose down -v ^&^& docker-compose up -d

pause