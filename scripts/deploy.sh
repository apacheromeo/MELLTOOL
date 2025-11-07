#!/bin/bash

# ============================================
# Production Deployment Script
# ============================================
# This script automates the deployment process
# For beginners: Just run ./scripts/deploy.sh
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root!"
    exit 1
fi

echo "============================================"
echo "  Inventory POS Deployment Script"
echo "  Production Environment"
echo "============================================"
echo ""

# Step 1: Check prerequisites
print_info "Step 1/10: Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Creating .env from .env.example..."

    # Create .env from backend example
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example .env
        print_warning "Please edit .env file with your secrets before continuing!"
        print_info "Run: nano .env"
        exit 1
    else
        print_error "No .env.example found. Cannot continue."
        exit 1
    fi
fi
print_success ".env file exists"

# Step 2: Validate environment variables
print_info "Step 2/10: Validating environment variables..."

source .env

# Check critical variables
MISSING_VARS=0

check_var() {
    if [ -z "${!1}" ]; then
        print_error "$1 is not set in .env"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        # Check if still using default weak values
        if [[ "${!1}" == *"CHANGE_ME"* ]]; then
            print_error "$1 is still set to default value. Please change it!"
            MISSING_VARS=$((MISSING_VARS + 1))
        else
            print_success "$1 is configured"
        fi
    fi
}

check_var "DATABASE_URL"
check_var "JWT_SECRET"
check_var "JWT_REFRESH_SECRET"
check_var "SESSION_SECRET"
check_var "FRONTEND_URL"

if [ $MISSING_VARS -gt 0 ]; then
    print_error "$MISSING_VARS required environment variables are missing or using defaults"
    print_info "Please update .env file and run this script again"
    exit 1
fi

# Step 3: Create necessary directories
print_info "Step 3/10: Creating necessary directories..."

mkdir -p backend/uploads/products
mkdir -p backend/logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p backups/postgres
mkdir -p backups/database
mkdir -p backups/full

chmod 700 data/postgres data/redis
chmod 755 backend/uploads backend/logs

print_success "Directories created"

# Step 4: Backup existing data (if exists)
print_info "Step 4/10: Backing up existing data..."

if docker ps | grep -q inventory_postgres; then
    print_info "Creating backup of current database..."
    BACKUP_FILE="backups/database/pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz"

    docker exec inventory_postgres pg_dump -U postgres inventory_db | gzip > "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE" ]; then
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "Backup failed, but continuing..."
    fi
else
    print_info "No existing database to backup"
fi

# Step 5: Pull latest code (if git repo)
print_info "Step 5/10: Checking for updates..."

if [ -d ".git" ]; then
    print_info "Fetching latest changes..."
    git fetch origin

    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo $LOCAL)

    if [ $LOCAL != $REMOTE ]; then
        print_warning "Updates available. Pulling changes..."
        git pull origin $(git rev-parse --abbrev-ref HEAD)
        print_success "Code updated"
    else
        print_info "Code is up to date"
    fi
else
    print_info "Not a git repository, skipping update check"
fi

# Step 6: Stop existing containers
print_info "Step 6/10: Stopping existing containers..."

if docker-compose ps | grep -q "Up"; then
    docker-compose down
    print_success "Containers stopped"
else
    print_info "No running containers to stop"
fi

# Step 7: Build containers
print_info "Step 7/10: Building containers (this may take 5-10 minutes)..."

docker-compose -f docker-compose.production.yml build --no-cache

if [ $? -eq 0 ]; then
    print_success "Containers built successfully"
else
    print_error "Build failed!"
    exit 1
fi

# Step 8: Start containers
print_info "Step 8/10: Starting containers..."

docker-compose -f docker-compose.production.yml up -d

# Wait for health checks
print_info "Waiting for services to be healthy..."
sleep 10

# Check if all containers are running
CONTAINERS=("inventory_postgres" "inventory_redis" "inventory_backend" "inventory_frontend")
ALL_RUNNING=true

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        print_success "$container is running"
    else
        print_error "$container is not running"
        ALL_RUNNING=false
    fi
done

if [ "$ALL_RUNNING" = false ]; then
    print_error "Some containers failed to start. Check logs:"
    print_info "docker-compose logs"
    exit 1
fi

# Step 9: Run database migrations
print_info "Step 9/10: Running database migrations..."

# Wait for backend to be fully ready
sleep 5

docker-compose exec -T backend npx prisma migrate deploy

if [ $? -eq 0 ]; then
    print_success "Migrations completed"
else
    print_warning "Migrations may have failed. Check manually:"
    print_info "docker-compose exec backend npx prisma migrate deploy"
fi

# Generate Prisma client
docker-compose exec -T backend npx prisma generate
print_success "Prisma client generated"

# Step 10: Health checks
print_info "Step 10/10: Running health checks..."

sleep 5

# Check backend health
BACKEND_HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null || echo "")

if [[ "$BACKEND_HEALTH" == *"ok"* ]] || [[ "$BACKEND_HEALTH" == *"status"* ]]; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check unclear. Manual verification needed."
    print_info "Check: curl http://localhost:3001/health"
fi

# Check frontend
FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$FRONTEND_HTTP" = "200" ] || [ "$FRONTEND_HTTP" = "304" ]; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend returned HTTP $FRONTEND_HTTP. May need time to start."
fi

# Final summary
echo ""
echo "============================================"
echo "  Deployment Summary"
echo "============================================"
echo ""
docker-compose ps
echo ""

print_success "Deployment completed!"
echo ""
print_info "Next steps:"
echo "  1. Test your application: http://YOUR_SERVER_IP:3000"
echo "  2. Check logs: docker-compose logs -f"
echo "  3. Set up Nginx reverse proxy for HTTPS"
echo "  4. Configure automated backups"
echo ""
print_info "Useful commands:"
echo "  - View logs: docker-compose logs -f [service]"
echo "  - Restart: docker-compose restart [service]"
echo "  - Stop all: docker-compose down"
echo "  - Update: ./scripts/deploy.sh"
echo ""

# Create deployment log
DEPLOY_LOG="deployments.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully" >> $DEPLOY_LOG
print_success "Deployment logged to $DEPLOY_LOG"

exit 0
