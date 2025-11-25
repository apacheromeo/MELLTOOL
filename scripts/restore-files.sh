#!/bin/bash

# MELLTOOL Files Restore Script
# This script restores uploaded files backup to Fly.io volume

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
echo -e "${RED}MELLTOOL Files Restore${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will replace your current uploaded files!${NC}"
echo ""

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/files/files_backup_20240101_120000.tar.gz"
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
read -p "Are you sure you want to restore? This will REPLACE all uploaded files! (yes/no): " CONFIRM

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

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract backup
echo -e "${YELLOW}Extracting backup archive...${NC}"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

if [ ! -d "$TEMP_DIR/uploads" ]; then
    echo -e "${RED}Error: Invalid backup file - uploads directory not found${NC}"
    exit 1
fi

FILE_COUNT=$(find "$TEMP_DIR/uploads" -type f | wc -l)
echo "Files to restore: $FILE_COUNT"
echo ""

# Upload to Fly.io
echo -e "${YELLOW}Uploading files to Fly.io volume...${NC}"
echo "This may take a while..."
echo ""

# Use fly sftp to upload
fly ssh sftp shell -a "$APP_NAME" << EOF
put -r $TEMP_DIR/uploads /app/
exit
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Restore completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Restored from: $BACKUP_FILE"
echo "Files restored: $FILE_COUNT"
echo "Completed at: $(date)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify files are accessible in the application"
echo "2. Check product images are displaying correctly"
echo "3. Test file downloads"
echo ""
