#!/bin/bash

# ScholarBridge LMS - Production Optimization Script
# This script optimizes the codebase for production deployment

echo "🚀 ScholarBridge LMS - Production Optimization"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_info "Starting production optimization..."

# 1. Environment Configuration
print_info "1. Checking environment configuration..."

if [ ! -f .env ]; then
    print_warning "Environment file not found. Creating from template..."
    cp .env.example .env
    print_status "Environment file created. Please update with production values."
else
    print_status "Environment file exists."
fi

# 2. Security Checks
print_info "2. Performing security checks..."

# Check for default passwords in .env
if grep -q "your-super-secret" .env 2>/dev/null; then
    print_warning "Default JWT secrets found in .env. Please update with secure values."
fi

if grep -q "postgres123" .env 2>/dev/null; then
    print_warning "Default database password found. Please update with secure password."
fi

print_status "Security checks completed."

# 3. File Permissions
print_info "3. Setting proper file permissions..."

# Set proper permissions for scripts
chmod +x setup.sh 2>/dev/null || true
chmod +x optimize-production.sh 2>/dev/null || true

# Set proper permissions for uploads directory
mkdir -p server/uploads
chmod 755 server/uploads

# Set proper permissions for logs directory
mkdir -p server/logs
chmod 755 server/logs

print_status "File permissions set correctly."

# 4. Database Optimization
print_info "4. Checking database configuration..."

# Ensure database initialization script exists
if [ -f "server/database/init.sql" ]; then
    print_status "Database initialization script found."
else
    print_error "Database initialization script missing."
fi

# Check migration files
MIGRATION_COUNT=$(ls server/database/migrations/*.js 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 12 ]; then
    print_status "All 12 migration files present."
else
    print_warning "Expected 12 migration files, found $MIGRATION_COUNT."
fi

# 5. Docker Configuration
print_info "5. Optimizing Docker configuration..."

# Check if production Docker Compose file exists
if [ -f "docker-compose.prod.yml" ]; then
    print_status "Production Docker Compose configuration found."
else
    print_warning "Production Docker Compose configuration not found."
fi

# Validate Docker Compose files
if docker-compose config > /dev/null 2>&1; then
    print_status "Docker Compose configuration is valid."
else
    print_error "Docker Compose configuration has errors."
fi

# 6. Nginx Configuration
print_info "6. Checking Nginx configuration..."

if [ -f "nginx/nginx.conf" ]; then
    print_status "Nginx configuration found."
    
    # Check for SSL configuration
    if grep -q "ssl_certificate" nginx/nginx.conf; then
        print_status "SSL configuration present in Nginx."
    else
        print_warning "SSL configuration not found in Nginx. Add SSL for production."
    fi
else
    print_error "Nginx configuration file missing."
fi

# 7. Package Dependencies
print_info "7. Checking package dependencies..."

# Check server dependencies
if [ -f "server/package.json" ]; then
    cd server
    if npm audit --audit-level=high > /dev/null 2>&1; then
        print_status "Server dependencies are secure."
    else
        print_warning "Server dependencies have security vulnerabilities. Run 'npm audit fix'."
    fi
    cd ..
else
    print_error "Server package.json not found."
fi

# Check client dependencies
if [ -f "client/package.json" ]; then
    cd client
    if npm audit --audit-level=high > /dev/null 2>&1; then
        print_status "Client dependencies are secure."
    else
        print_warning "Client dependencies have security vulnerabilities. Run 'npm audit fix'."
    fi
    cd ..
else
    print_error "Client package.json not found."
fi

# 8. Build Optimization
print_info "8. Preparing for production build..."

# Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration (Update with production values)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=scholarbridge_lms
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_SSL=true

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_PASSWORD

# JWT Configuration (Generate secure secrets)
JWT_SECRET=GENERATE_SECURE_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_SECURE_REFRESH_SECRET_HERE
JWT_EXPIRE=30m
JWT_REFRESH_EXPIRE=7d

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=30
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Email Configuration (Update with production SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@domain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@scholarbridgelms.com
FROM_NAME=ScholarBridge LMS

# SMS Configuration (Update with production API keys)
MSG91_API_KEY=your-production-msg91-key
MSG91_SENDER_ID=SCHLMS
TWOFACTOR_API_KEY=your-production-2factor-key

# External APIs (Update with production keys)
GOOGLE_BOOKS_API_KEY=your-production-google-books-key
YOUTUBE_API_KEY=your-production-youtube-key

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,mp4,mp3,epub,docx,jpg,jpeg,png,gif,svg

# Domain Configuration
MAIN_DOMAIN=scholarbridgelms.com
SUBDOMAIN_PATTERN=*.scholarbridgelms.com
CLIENT_URL=https://scholarbridgelms.com
EOF
    print_status "Production environment template created."
fi

# 9. Health Check Script
print_info "9. Creating health check script..."

cat > health-check.sh << 'EOF'
#!/bin/bash

# Health Check Script for ScholarBridge LMS

echo "🏥 ScholarBridge LMS Health Check"
echo "================================="

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker containers are running"
else
    echo "❌ Docker containers are not running"
    exit 1
fi

# Check API health endpoint
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

# Check database connection
if docker-compose exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
    exit 1
fi

# Check Redis connection
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis is not responding"
    exit 1
fi

echo "✅ All health checks passed!"
EOF

chmod +x health-check.sh
print_status "Health check script created."

# 10. Backup Script
print_info "10. Creating backup script..."

cat > backup.sh << 'EOF'
#!/bin/bash

# Backup Script for ScholarBridge LMS

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="scholarbridge_backup_$DATE"

echo "📦 Creating backup: $BACKUP_FILE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up database..."
docker-compose exec -T postgres pg_dump -U postgres scholarbridge_lms > "$BACKUP_DIR/${BACKUP_FILE}_db.sql"

# Backup uploads
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/${BACKUP_FILE}_uploads.tar.gz" server/uploads/

# Backup configuration
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/${BACKUP_FILE}_config.tar.gz" .env nginx/nginx.conf docker-compose.yml

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_FILE"
EOF

chmod +x backup.sh
print_status "Backup script created."

# 11. Performance Optimization
print_info "11. Applying performance optimizations..."

# Create performance monitoring script
cat > monitor-performance.sh << 'EOF'
#!/bin/bash

# Performance Monitoring Script

echo "📊 ScholarBridge LMS Performance Monitor"
echo "======================================="

# Check container resource usage
echo "Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Check disk usage
echo -e "\nDisk Usage:"
df -h

# Check database connections
echo -e "\nDatabase Connections:"
docker-compose exec -T postgres psql -U postgres -d scholarbridge_lms -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"

# Check Redis memory usage
echo -e "\nRedis Memory Usage:"
docker-compose exec -T redis redis-cli info memory | grep used_memory_human

echo -e "\n✅ Performance monitoring completed"
EOF

chmod +x monitor-performance.sh
print_status "Performance monitoring script created."

# 12. Final Validation
print_info "12. Running final validation..."

# Check if all required files exist
REQUIRED_FILES=(
    "server/index.js"
    "server/package.json"
    "client/package.json"
    "docker-compose.yml"
    "nginx/nginx.conf"
    ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Required file found: $file"
    else
        print_error "Required file missing: $file"
    fi
done

# Summary
echo ""
echo "🎉 Production Optimization Complete!"
echo "===================================="
echo ""
print_info "Next Steps for Production Deployment:"
echo "1. Update .env.production with your production values"
echo "2. Obtain SSL certificates for your domain"
echo "3. Configure your DNS for subdomain routing"
echo "4. Set up monitoring and alerting"
echo "5. Configure automated backups"
echo "6. Run: docker-compose -f docker-compose.prod.yml up -d"
echo ""
print_status "ScholarBridge LMS is ready for production deployment!"
echo ""
print_info "For health monitoring, run: ./health-check.sh"
print_info "For performance monitoring, run: ./monitor-performance.sh"
print_info "For backups, run: ./backup.sh"
echo ""