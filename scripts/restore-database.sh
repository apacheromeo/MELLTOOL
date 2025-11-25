#!/bin/bash

# MELLTOOL Database Restore Script
# This script restores a PostgreSQL database backup to Fly.io

set -e  # Exit on error

# Configuration
APP_NAME="${FLY_APP_NAME:-melltool-backend}"
BACKUP_FILE="$1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}MELLTOOL Database Restore${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will replace your current database!${NC}"
echo ""

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/database/database_backup_20240101_120000.sql.gz"
    echo ""
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo "Backup file: $BACKUP_FILE"
echo "App name: $APP_NAME"
echo ""

# Confirm restoration
read -p "Are you sure you want to restore? This will REPLACE all current data! (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

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
    exit 1
fi

# Extract database connection details
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo ""
echo -e "${YELLOW}Restoring database...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo ""
echo "This may take several minutes..."
echo ""

# Decompress and restore
export PGPASSWORD="$DB_PASS"

gunzip -c "$BACKUP_FILE" | psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --quiet

unset PGPASSWORD

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Restore completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Restored from: $BACKUP_FILE"
echo "Completed at: $(date)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify data integrity"
echo "2. Test application functionality"
echo "3. Check for any missing data"
echo "4. Restart the application if needed: fly deploy -a $APP_NAME"
echo ""
