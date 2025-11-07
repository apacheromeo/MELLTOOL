#!/bin/bash

# ============================================
# Database Restore Script
# ============================================
# Restores database from backup
# Usage: ./scripts/restore.sh <backup_file>
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${NC}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo "============================================"
echo "  Database Restore Script"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "No backup file specified!"
    echo ""
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh ~/backups/database/*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_info "Backup file: $BACKUP_FILE"
print_info "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Warning
print_warning "WARNING: This will REPLACE your current database!"
print_warning "All current data will be lost."
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Restore cancelled."
    exit 0
fi

# Create safety backup of current database
print_info "Creating safety backup of current database..."
SAFETY_BACKUP="$HOME/backups/database/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

if docker ps | grep -q inventory_postgres; then
    docker exec inventory_postgres pg_dump -U postgres inventory_db | gzip > "$SAFETY_BACKUP"
    print_success "Safety backup created: $SAFETY_BACKUP"
else
    print_warning "Database container not running. No safety backup created."
fi

# Stop backend to prevent connections
print_info "Stopping backend service..."
docker-compose stop backend
print_success "Backend stopped"

# Restore database
print_info "Restoring database from backup..."

# Drop existing connections
docker exec inventory_postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'inventory_db' AND pid <> pg_backend_pid();" 2>/dev/null || true

# Drop and recreate database
docker exec inventory_postgres psql -U postgres -c "DROP DATABASE IF EXISTS inventory_db;" 2>/dev/null || true
docker exec inventory_postgres psql -U postgres -c "CREATE DATABASE inventory_db;"

# Restore from backup
gunzip -c "$BACKUP_FILE" | docker exec -i inventory_postgres psql -U postgres -d inventory_db

if [ $? -eq 0 ]; then
    print_success "Database restored successfully!"
else
    print_error "Restore failed!"
    print_warning "Your database may be in an inconsistent state."
    print_info "To restore from safety backup:"
    print_info "./scripts/restore.sh $SAFETY_BACKUP"
    exit 1
fi

# Restart backend
print_info "Starting backend service..."
docker-compose start backend

# Wait for backend to be ready
sleep 5

# Run migrations (in case backup is older)
print_info "Running migrations..."
docker-compose exec backend npx prisma migrate deploy 2>/dev/null || true

print_success "Backend started"

# Health check
print_info "Running health check..."
sleep 3

HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null || echo "")
if [[ "$HEALTH" == *"ok"* ]] || [[ "$HEALTH" == *"status"* ]]; then
    print_success "Health check passed!"
else
    print_warning "Health check unclear. Please verify manually:"
    print_info "curl http://localhost:3001/health"
    print_info "docker-compose logs backend"
fi

# Summary
echo ""
echo "============================================"
echo "  Restore Summary"
echo "============================================"
echo "Restored from: $BACKUP_FILE"
echo "Safety backup: $SAFETY_BACKUP"
echo ""
print_success "Restore completed!"
echo ""
print_info "Next steps:"
echo "  1. Test your application"
echo "  2. Verify data integrity"
echo "  3. If issues, restore safety backup:"
echo "     ./scripts/restore.sh $SAFETY_BACKUP"
echo ""

# Log restore
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database restored from: $BACKUP_FILE" >> "$HOME/backups/restore.log"

exit 0
