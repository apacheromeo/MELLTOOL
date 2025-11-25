#!/bin/bash

# MELLTOOL Complete Backup Script
# This script backs up both database and files

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
BACKUP_BASE_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MELLTOOL Complete Backup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Starting complete backup at: $(date)"
echo ""

# Create backup directories
mkdir -p "$BACKUP_BASE_DIR/database"
mkdir -p "$BACKUP_BASE_DIR/files"

# Backup database
echo -e "${YELLOW}[1/2] Backing up database...${NC}"
echo ""
export BACKUP_DIR="$BACKUP_BASE_DIR/database"
bash "$SCRIPT_DIR/backup-database.sh"
echo ""

# Backup files
echo -e "${YELLOW}[2/2] Backing up files...${NC}"
echo ""
export BACKUP_DIR="$BACKUP_BASE_DIR/files"
bash "$SCRIPT_DIR/backup-files.sh"
echo ""

# Create a manifest file
MANIFEST_FILE="$BACKUP_BASE_DIR/backup_manifest_${TIMESTAMP}.txt"
cat > "$MANIFEST_FILE" << EOF
MELLTOOL Backup Manifest
========================
Backup Date: $(date)
Timestamp: $TIMESTAMP

Database Backup:
$(ls -lh "$BACKUP_BASE_DIR/database/database_backup_${TIMESTAMP}"*.sql.gz 2>/dev/null || echo "Not found")

Files Backup:
$(ls -lh "$BACKUP_BASE_DIR/files/files_backup_${TIMESTAMP}"*.tar.gz 2>/dev/null || echo "Not found")

System Information:
-------------------
Hostname: $(hostname)
User: $(whoami)
Fly App: ${FLY_APP_NAME:-melltool-backend}

Notes:
------
- Store this manifest with your backups
- Upload backups to off-site storage (S3, Google Cloud, etc.)
- Test restoration periodically
- Keep backups for at least 30 days
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Complete Backup Finished!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup location: $BACKUP_BASE_DIR"
echo "Manifest: $MANIFEST_FILE"
echo "Completed at: $(date)"
echo ""
echo -e "${YELLOW}Backup Summary:${NC}"
echo "---------------"
ls -lh "$BACKUP_BASE_DIR/database/"database_backup_*"${TIMESTAMP}"*.sql.gz 2>/dev/null || true
ls -lh "$BACKUP_BASE_DIR/files/"files_backup_*"${TIMESTAMP}"*.tar.gz 2>/dev/null || true
echo ""
echo -e "${YELLOW}Important Next Steps:${NC}"
echo "1. Upload backups to cloud storage (recommended: AWS S3, Google Cloud Storage)"
echo "2. Verify backups are complete and can be extracted"
echo "3. Test restoration on a separate environment"
echo "4. Document backup locations and access credentials securely"
echo ""
echo -e "${GREEN}Recommended: Set up automated daily backups via cron${NC}"
echo "Run: crontab -e"
echo "Add: 0 2 * * * $SCRIPT_DIR/backup-all.sh"
echo ""
