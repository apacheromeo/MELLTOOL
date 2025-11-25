# MELLTOOL Backup Scripts

Quick reference for backup and restore operations.

## Quick Commands

```bash
# Make scripts executable (first time only)
chmod +x *.sh

# Complete backup (recommended)
./backup-all.sh

# Database only
./backup-database.sh

# Files only
./backup-files.sh

# Restore database
./restore-database.sh ../backups/database/database_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore files
./restore-files.sh ../backups/files/files_backup_YYYYMMDD_HHMMSS.tar.gz
```

## Environment Variables

```bash
# Custom backup location
export BACKUP_DIR=/path/to/backups
./backup-all.sh

# Custom retention (default: 30 days)
export RETENTION_DAYS=60
./backup-all.sh

# Custom app name
export FLY_APP_NAME=my-app
./backup-all.sh
```

## Automated Backup Setup

### Daily at 2 AM

```bash
# Add to crontab
crontab -e

# Add this line:
0 2 * * * cd /path/to/MELLTOOL/scripts && ./backup-all.sh
```

## Files Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup-all.sh` | Complete backup (DB + files) | `./backup-all.sh` |
| `backup-database.sh` | Database backup only | `./backup-database.sh` |
| `backup-files.sh` | Files backup only | `./backup-files.sh` |
| `restore-database.sh` | Restore database | `./restore-database.sh <file>` |
| `restore-files.sh` | Restore files | `./restore-files.sh <file>` |

## Backup Locations

```
backups/
├── database/
│   ├── database_backup_20240101_120000.sql.gz
│   ├── database_backup_20240102_120000.sql.gz
│   └── database_backup_latest.sql.gz -> database_backup_20240102_120000.sql.gz
├── files/
│   ├── files_backup_20240101_120000.tar.gz
│   ├── files_backup_20240102_120000.tar.gz
│   └── files_backup_latest.tar.gz -> files_backup_20240102_120000.tar.gz
└── backup_manifest_20240102_120000.txt
```

## Troubleshooting

**Error: Permission denied**
```bash
chmod +x *.sh
```

**Error: fly command not found**
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

**Error: pg_dump command not found**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

For detailed documentation, see: [../BACKUP_GUIDE.md](../BACKUP_GUIDE.md)
