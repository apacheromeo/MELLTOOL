#!/bin/bash

# MELLTOOL Database Backup Script
# This script backs up the PostgreSQL database from Fly.io

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
APP_NAME="${FLY_APP_NAME:-melltool-backend}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_backup_${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MELLTOOL Database Backup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup started at: $(date)"
echo "App name: $APP_NAME"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo -e "${RED}Error: Fly CLI is not installed${NC}"
    echo "Install it from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Get database connection string from Fly.io
echo -e "${YELLOW}Fetching database connection string...${NC}"
DATABASE_URL=$(fly secrets list -a "$APP_NAME" | grep DATABASE_URL | awk '{print $2}')

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: Could not fetch DATABASE_URL from Fly.io${NC}"
    echo "Make sure you're logged in to Fly.io: fly auth login"
    exit 1
fi

# Extract database connection details
# Format: postgres://user:password@host:port/database
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}Creating database backup...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo ""

# Create backup using pg_dump
export PGPASSWORD="$DB_PASS"
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

unset PGPASSWORD

# Verify backup was created
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "File: $BACKUP_DIR/$BACKUP_FILE"
    echo "Size: $BACKUP_SIZE"
    echo ""
else
    echo -e "${RED}✗ Backup failed - file not created${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "database_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "database_backup_*.sql.gz" -type f | wc -l)
echo "Backups retained: $REMAINING_BACKUPS"
echo ""

# Create a latest symlink
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/database_backup_latest.sql.gz"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"
echo "Completed at: $(date)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload backup to cloud storage (S3, Google Cloud Storage, etc.)"
echo "2. Verify backup integrity"
echo "3. Test restoration procedure periodically"
echo ""
