#!/bin/bash

# MELLTOOL Files Backup Script
# This script backs up uploaded files (images, etc.) from Fly.io volume

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/files}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
APP_NAME="${FLY_APP_NAME:-melltool-backend}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="files_backup_${TIMESTAMP}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MELLTOOL Files Backup${NC}"
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

# Get list of machines
echo -e "${YELLOW}Finding active machine...${NC}"
MACHINE_ID=$(fly machines list -a "$APP_NAME" --json | jq -r '.[0].id')

if [ -z "$MACHINE_ID" ]; then
    echo -e "${RED}Error: Could not find active machine${NC}"
    exit 1
fi

echo "Machine ID: $MACHINE_ID"
echo ""

# Create temporary directory for download
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Download files from Fly.io volume
echo -e "${YELLOW}Downloading files from Fly.io volume...${NC}"
echo "This may take a while depending on the size of your uploads..."
echo ""

# Use fly sftp to download the uploads directory
fly ssh sftp shell -a "$APP_NAME" -C "get -r /app/uploads $TEMP_DIR/"

if [ ! -d "$TEMP_DIR/uploads" ]; then
    echo -e "${RED}Error: Failed to download uploads directory${NC}"
    exit 1
fi

# Count files
FILE_COUNT=$(find "$TEMP_DIR/uploads" -type f | wc -l)
echo "Files downloaded: $FILE_COUNT"
echo ""

# Create compressed archive
echo -e "${YELLOW}Creating compressed archive...${NC}"
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" uploads/

# Verify backup was created
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "File: $BACKUP_DIR/$BACKUP_FILE"
    echo "Size: $BACKUP_SIZE"
    echo "Files: $FILE_COUNT"
    echo ""
else
    echo -e "${RED}✗ Backup failed - file not created${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -type f | wc -l)
echo "Backups retained: $REMAINING_BACKUPS"
echo ""

# Create a latest symlink
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/files_backup_latest.tar.gz"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"
echo "Completed at: $(date)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload backup to cloud storage (S3, Google Cloud Storage, etc.)"
echo "2. Verify backup can be extracted"
echo "3. Test restoration procedure periodically"
echo ""
