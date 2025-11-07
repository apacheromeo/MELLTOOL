#!/bin/bash

# ============================================
# Automated Backup Script
# ============================================
# Backs up database and important files
# Usage: ./scripts/backup.sh [--full]
# ============================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
DB_BACKUP_DIR="$BACKUP_DIR/database"
FULL_BACKUP_DIR="$BACKUP_DIR/full"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
RETENTION_DAYS=7  # Keep backups for 7 days
FULL_RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${NC}ℹ $1${NC}"; }

# Create backup directories
mkdir -p "$DB_BACKUP_DIR"
mkdir -p "$FULL_BACKUP_DIR"

echo "============================================"
echo "  Backup Script"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# Database backup
print_info "Backing up database..."

# Check if container is running
if ! docker ps | grep -q inventory_postgres; then
    print_error "PostgreSQL container is not running!"
    exit 1
fi

# Create database backup
DB_FILE="$DB_BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"
docker exec inventory_postgres pg_dump -U postgres inventory_db | gzip > "$DB_FILE"

if [ -f "$DB_FILE" ]; then
    SIZE=$(du -h "$DB_FILE" | cut -f1)
    print_success "Database backup created: $DB_FILE ($SIZE)"
else
    print_error "Database backup failed!"
    exit 1
fi

# Full backup if requested
if [ "$1" == "--full" ]; then
    print_info "Creating full backup..."

    # Backup uploads
    print_info "Backing up upload files..."
    UPLOAD_FILE="$FULL_BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"

    if [ -d "backend/uploads" ]; then
        tar -czf "$UPLOAD_FILE" -C backend uploads 2>/dev/null || true
        if [ -f "$UPLOAD_FILE" ]; then
            SIZE=$(du -h "$UPLOAD_FILE" | cut -f1)
            print_success "Uploads backup created: $UPLOAD_FILE ($SIZE)"
        fi
    else
        print_info "No uploads directory found, skipping..."
    fi

    # Backup configuration (encrypted)
    print_info "Backing up configuration files..."
    CONFIG_FILE="$FULL_BACKUP_DIR/config_${TIMESTAMP}.tar.gz"

    tar -czf "$CONFIG_FILE" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='build' \
        .env docker-compose.yml docker-compose.production.yml 2>/dev/null || true

    if [ -f "$CONFIG_FILE" ]; then
        # Encrypt configuration backup
        if command -v gpg &> /dev/null; then
            print_info "Encrypting configuration backup..."
            gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase="${ENCRYPTION_KEY:-changeme}" "$CONFIG_FILE"
            rm "$CONFIG_FILE"
            print_success "Configuration backup encrypted: ${CONFIG_FILE}.gpg"
        else
            print_success "Configuration backup created: $CONFIG_FILE"
            print_info "Install GPG for encryption: sudo apt install gpg"
        fi
    fi

    print_success "Full backup completed!"
fi

# Cleanup old backups
print_info "Cleaning up old backups..."

# Clean database backups
DELETED_DB=$(find "$DB_BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_DB" -gt 0 ]; then
    print_info "Deleted $DELETED_DB old database backup(s)"
fi

# Clean full backups
if [ "$1" == "--full" ]; then
    DELETED_FULL=$(find "$FULL_BACKUP_DIR" -name "*.tar.gz*" -mtime +$FULL_RETENTION_DAYS -delete -print | wc -l)
    if [ "$DELETED_FULL" -gt 0 ]; then
        print_info "Deleted $DELETED_FULL old full backup(s)"
    fi
fi

# Upload to cloud (optional)
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    print_info "Uploading to S3..."

    aws s3 cp "$DB_FILE" "s3://$S3_BUCKET/inventory-backups/database/" --quiet

    if [ $? -eq 0 ]; then
        print_success "Uploaded to S3: s3://$S3_BUCKET/inventory-backups/database/"
    else
        print_error "S3 upload failed"
    fi
fi

# Summary
echo ""
echo "============================================"
echo "  Backup Summary"
echo "============================================"
echo "Database backup: $DB_FILE"
if [ "$1" == "--full" ]; then
    echo "Uploads backup: $UPLOAD_FILE"
    echo "Config backup: ${CONFIG_FILE}.gpg"
fi
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Total size: $(du -sh $BACKUP_DIR | cut -f1)"
echo ""
print_success "Backup completed successfully!"

# Log backup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed: $DB_FILE" >> "$BACKUP_DIR/backup.log"

exit 0
