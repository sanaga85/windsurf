@echo off
REM ScholarBridge LMS - Production Optimization Script (Windows)
REM This script optimizes the codebase for production deployment

echo 🚀 ScholarBridge LMS - Production Optimization
echo ==============================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ℹ️  Starting production optimization...

REM 1. Environment Configuration
echo ℹ️  1. Checking environment configuration...

if not exist .env (
    echo ⚠️  Environment file not found. Creating from template...
    copy .env.example .env >nul
    echo ✅ Environment file created. Please update with production values.
) else (
    echo ✅ Environment file exists.
)

REM 2. Security Checks
echo ℹ️  2. Performing security checks...

findstr /C:"your-super-secret" .env >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Default JWT secrets found in .env. Please update with secure values.
)

findstr /C:"postgres123" .env >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Default database password found. Please update with secure password.
)

echo ✅ Security checks completed.

REM 3. Directory Creation
echo ℹ️  3. Creating required directories...

if not exist server\uploads mkdir server\uploads
if not exist server\logs mkdir server\logs
if not exist backups mkdir backups

echo ✅ Required directories created.

REM 4. Database Configuration
echo ℹ️  4. Checking database configuration...

if exist server\database\init.sql (
    echo ✅ Database initialization script found.
) else (
    echo ❌ Database initialization script missing.
)

REM Count migration files
set /a MIGRATION_COUNT=0
for %%f in (server\database\migrations\*.js) do set /a MIGRATION_COUNT+=1

if %MIGRATION_COUNT%==12 (
    echo ✅ All 12 migration files present.
) else (
    echo ⚠️  Expected 12 migration files, found %MIGRATION_COUNT%.
)

REM 5. Docker Configuration
echo ℹ️  5. Checking Docker configuration...

if exist docker-compose.prod.yml (
    echo ✅ Production Docker Compose configuration found.
) else (
    echo ⚠️  Production Docker Compose configuration not found.
)

REM Validate Docker Compose files
docker-compose config >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose configuration has errors.
) else (
    echo ✅ Docker Compose configuration is valid.
)

REM 6. Nginx Configuration
echo ℹ️  6. Checking Nginx configuration...

if exist nginx\nginx.conf (
    echo ✅ Nginx configuration found.
    
    findstr /C:"ssl_certificate" nginx\nginx.conf >nul 2>&1
    if not errorlevel 1 (
        echo ✅ SSL configuration present in Nginx.
    ) else (
        echo ⚠️  SSL configuration not found in Nginx. Add SSL for production.
    )
) else (
    echo ❌ Nginx configuration file missing.
)

REM 7. Create Production Environment Template
echo ℹ️  7. Creating production environment template...

if not exist .env.production (
    (
        echo # Production Environment Configuration
        echo NODE_ENV=production
        echo PORT=5000
        echo.
        echo # Database Configuration ^(Update with production values^)
        echo DB_HOST=postgres
        echo DB_PORT=5432
        echo DB_NAME=scholarbridge_lms
        echo DB_USER=postgres
        echo DB_PASSWORD=CHANGE_THIS_PASSWORD
        echo DB_SSL=true
        echo.
        echo # Redis Configuration
        echo REDIS_HOST=redis
        echo REDIS_PORT=6379
        echo REDIS_PASSWORD=CHANGE_THIS_PASSWORD
        echo.
        echo # JWT Configuration ^(Generate secure secrets^)
        echo JWT_SECRET=GENERATE_SECURE_SECRET_HERE
        echo JWT_REFRESH_SECRET=GENERATE_SECURE_REFRESH_SECRET_HERE
        echo JWT_EXPIRE=30m
        echo JWT_REFRESH_EXPIRE=7d
        echo.
        echo # Security Configuration
        echo BCRYPT_ROUNDS=12
        echo SESSION_TIMEOUT=30
        echo MAX_LOGIN_ATTEMPTS=5
        echo LOCKOUT_TIME=15
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW=15
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Logging
        echo LOG_LEVEL=info
        echo LOG_FILE_PATH=./logs
        echo.
        echo # Email Configuration ^(Update with production SMTP^)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your-production-email@domain.com
        echo SMTP_PASS=your-app-password
        echo FROM_EMAIL=noreply@scholarbridgelms.com
        echo FROM_NAME=ScholarBridge LMS
        echo.
        echo # SMS Configuration ^(Update with production API keys^)
        echo MSG91_API_KEY=your-production-msg91-key
        echo MSG91_SENDER_ID=SCHLMS
        echo TWOFACTOR_API_KEY=your-production-2factor-key
        echo.
        echo # External APIs ^(Update with production keys^)
        echo GOOGLE_BOOKS_API_KEY=your-production-google-books-key
        echo YOUTUBE_API_KEY=your-production-youtube-key
        echo.
        echo # File Upload
        echo MAX_FILE_SIZE=100MB
        echo UPLOAD_PATH=./uploads
        echo ALLOWED_FILE_TYPES=pdf,mp4,mp3,epub,docx,jpg,jpeg,png,gif,svg
        echo.
        echo # Domain Configuration
        echo MAIN_DOMAIN=scholarbridgelms.com
        echo SUBDOMAIN_PATTERN=*.scholarbridgelms.com
        echo CLIENT_URL=https://scholarbridgelms.com
    ) > .env.production
    echo ✅ Production environment template created.
)

REM 8. Create Health Check Script
echo ℹ️  8. Creating health check script...

(
    echo @echo off
    echo REM Health Check Script for ScholarBridge LMS
    echo.
    echo echo 🏥 ScholarBridge LMS Health Check
    echo echo =================================
    echo.
    echo REM Check if containers are running
    echo docker-compose ps ^| findstr "Up" ^>nul 2^>^&1
    echo if errorlevel 1 ^(
    echo     echo ❌ Docker containers are not running
    echo     exit /b 1
    echo ^) else ^(
    echo     echo ✅ Docker containers are running
    echo ^)
    echo.
    echo REM Check API health endpoint
    echo curl -f http://localhost:5000/health ^>nul 2^>^&1
    echo if errorlevel 1 ^(
    echo     echo ❌ API health check failed
    echo     exit /b 1
    echo ^) else ^(
    echo     echo ✅ API health check passed
    echo ^)
    echo.
    echo echo ✅ Health checks completed!
    echo pause
) > health-check.bat

echo ✅ Health check script created.

REM 9. Create Backup Script
echo ℹ️  9. Creating backup script...

(
    echo @echo off
    echo REM Backup Script for ScholarBridge LMS
    echo.
    echo set BACKUP_DIR=backups
    echo for /f "tokens=1-4 delims=/ " %%%%a in ^('date /t'^) do set DATE=%%%%c%%%%a%%%%b
    echo for /f "tokens=1-2 delims=: " %%%%a in ^('time /t'^) do set TIME=%%%%a%%%%b
    echo set BACKUP_FILE=scholarbridge_backup_%%DATE%%_%%TIME%%
    echo.
    echo echo 📦 Creating backup: %%BACKUP_FILE%%
    echo.
    echo if not exist %%BACKUP_DIR%% mkdir %%BACKUP_DIR%%
    echo.
    echo echo Backing up database...
    echo docker-compose exec -T postgres pg_dump -U postgres scholarbridge_lms ^> "%%BACKUP_DIR%%\%%BACKUP_FILE%%_db.sql"
    echo.
    echo echo Backing up uploads...
    echo tar -czf "%%BACKUP_DIR%%\%%BACKUP_FILE%%_uploads.tar.gz" server\uploads\
    echo.
    echo echo ✅ Backup completed: %%BACKUP_DIR%%\%%BACKUP_FILE%%
    echo pause
) > backup.bat

echo ✅ Backup script created.

REM 10. Final Validation
echo ℹ️  10. Running final validation...

set VALIDATION_PASSED=1

if exist server\index.js (
    echo ✅ Required file found: server\index.js
) else (
    echo ❌ Required file missing: server\index.js
    set VALIDATION_PASSED=0
)

if exist server\package.json (
    echo ✅ Required file found: server\package.json
) else (
    echo ❌ Required file missing: server\package.json
    set VALIDATION_PASSED=0
)

if exist client\package.json (
    echo ✅ Required file found: client\package.json
) else (
    echo ❌ Required file missing: client\package.json
    set VALIDATION_PASSED=0
)

if exist docker-compose.yml (
    echo ✅ Required file found: docker-compose.yml
) else (
    echo ❌ Required file missing: docker-compose.yml
    set VALIDATION_PASSED=0
)

if exist nginx\nginx.conf (
    echo ✅ Required file found: nginx\nginx.conf
) else (
    echo ❌ Required file missing: nginx\nginx.conf
    set VALIDATION_PASSED=0
)

if exist .env.example (
    echo ✅ Required file found: .env.example
) else (
    echo ❌ Required file missing: .env.example
    set VALIDATION_PASSED=0
)

REM Summary
echo.
echo 🎉 Production Optimization Complete!
echo ====================================
echo.
echo ℹ️  Next Steps for Production Deployment:
echo 1. Update .env.production with your production values
echo 2. Obtain SSL certificates for your domain
echo 3. Configure your DNS for subdomain routing
echo 4. Set up monitoring and alerting
echo 5. Configure automated backups
echo 6. Run: docker-compose -f docker-compose.prod.yml up -d
echo.

if %VALIDATION_PASSED%==1 (
    echo ✅ ScholarBridge LMS is ready for production deployment!
) else (
    echo ⚠️  Some validation checks failed. Please review the errors above.
)

echo.
echo ℹ️  For health monitoring, run: health-check.bat
echo ℹ️  For backups, run: backup.bat
echo.
pause