# MELLTOOL Backup & Recovery Guide

Complete guide for backing up and restoring your MELLTOOL inventory management system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Backup Components](#backup-components)
3. [Manual Backup](#manual-backup)
4. [Automated Backup Setup](#automated-backup-setup)
5. [Cloud Storage Integration](#cloud-storage-integration)
6. [Restoration Procedures](#restoration-procedures)
7. [Best Practices](#best-practices)
8. [Disaster Recovery](#disaster-recovery)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

```bash
# Install required tools
brew install postgresql  # macOS
# or
apt-get install postgresql-client  # Ubuntu/Debian

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login
```

### Quick Backup (All Data)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run complete backup
./scripts/backup-all.sh
```

Backups will be saved to `./backups/` directory.

---

## Backup Components

MELLTOOL has two critical data components:

### 1. **Database (PostgreSQL)**
- Product information
- Categories and brands
- Sales orders and history
- User accounts
- Stock levels
- All transactional data

**Location**: Fly.io Postgres database
**Backup File**: `database_backup_YYYYMMDD_HHMMSS.sql.gz` (compressed SQL dump)

### 2. **Uploaded Files**
- Product images
- Barcode images
- Generated reports
- Uploaded Excel files

**Location**: Fly.io volume `/app/uploads`
**Backup File**: `files_backup_YYYYMMDD_HHMMSS.tar.gz` (compressed archive)

---

## Manual Backup

### Database Only

```bash
./scripts/backup-database.sh
```

**What it does:**
- Connects to Fly.io Postgres
- Creates compressed SQL dump
- Saves to `./backups/database/`
- Retains backups for 30 days
- Creates `database_backup_latest.sql.gz` symlink

### Files Only

```bash
./scripts/backup-files.sh
```

**What it does:**
- Downloads all files from Fly.io volume
- Creates compressed archive
- Saves to `./backups/files/`
- Retains backups for 30 days
- Creates `files_backup_latest.tar.gz` symlink

### Complete Backup

```bash
./scripts/backup-all.sh
```

**What it does:**
- Runs both database and files backup
- Creates manifest file with backup details
- Provides summary of backup sizes

---

## Automated Backup Setup

### Option 1: Cron (Linux/macOS)

**Daily backup at 2 AM:**

```bash
# Edit crontab
crontab -e

# Add this line:
0 2 * * * cd /path/to/MELLTOOL && ./scripts/backup-all.sh >> /var/log/melltool-backup.log 2>&1
```

**Weekly backup (Sunday 3 AM):**
```bash
0 3 * * 0 cd /path/to/MELLTOOL && ./scripts/backup-all.sh
```

**Hourly backup (critical systems):**
```bash
0 * * * * cd /path/to/MELLTOOL && ./scripts/backup-all.sh
```

### Option 2: GitHub Actions (Automated Cloud Backup)

Create `.github/workflows/backup.yml`:

```yaml
name: Automated Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          curl -L https://fly.io/install.sh | sh
          sudo apt-get install postgresql-client

      - name: Run backup
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          chmod +x scripts/*.sh
          ./scripts/backup-all.sh

      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Sync backups
        run: |
          aws s3 sync ./backups/ s3://your-bucket/melltool-backups/
```

### Option 3: Fly.io Scheduled Machine

Create a backup machine that runs daily:

```toml
# fly-backup.toml
app = "melltool-backup"

[deploy]
  strategy = "immediate"

[[services]]
  internal_port = 8080
  protocol = "tcp"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256

[processes]
  backup = "/app/scripts/backup-all.sh"
```

---

## Cloud Storage Integration

### AWS S3

**Setup:**

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
pip install awscli

# Configure AWS credentials
aws configure
```

**Upload backup:**

```bash
# Single backup
aws s3 cp ./backups/ s3://your-bucket/melltool-backups/ --recursive

# Automated sync
aws s3 sync ./backups/ s3://your-bucket/melltool-backups/
```

**Automated script** (`scripts/upload-to-s3.sh`):

```bash
#!/bin/bash
BUCKET="your-bucket-name"
aws s3 sync ./backups/ s3://$BUCKET/melltool-backups/ \
  --exclude "*" \
  --include "database_backup_*.sql.gz" \
  --include "files_backup_*.tar.gz" \
  --include "backup_manifest_*.txt"
```

### Google Cloud Storage

```bash
# Install gcloud
brew install google-cloud-sdk

# Authenticate
gcloud auth login

# Upload
gsutil -m cp -r ./backups/ gs://your-bucket/melltool-backups/
```

### Backblaze B2 (Cost-Effective)

```bash
# Install B2 CLI
pip install b2

# Authenticate
b2 authorize-account YOUR_KEY_ID YOUR_APPLICATION_KEY

# Sync backups
b2 sync ./backups/ b2://your-bucket/melltool-backups/
```

---

## Restoration Procedures

### ⚠️ IMPORTANT: Test Restoration Regularly!

**Best Practice**: Test restoration monthly on a separate environment.

### Restore Database

```bash
./scripts/restore-database.sh ./backups/database/database_backup_20240101_120000.sql.gz
```

**Steps:**
1. Script will show warning
2. Confirm with `yes`
3. Wait for restoration (1-10 minutes depending on size)
4. Verify data in application
5. Restart app if needed: `fly deploy`

### Restore Files

```bash
./scripts/restore-files.sh ./backups/files/files_backup_20240101_120000.tar.gz
```

**Steps:**
1. Script will show warning
2. Confirm with `yes`
3. Wait for upload (depends on file count)
4. Verify images display correctly in app

### Complete Restoration

```bash
# 1. Restore database
./scripts/restore-database.sh ./backups/database/database_backup_latest.sql.gz

# 2. Restore files
./scripts/restore-files.sh ./backups/files/files_backup_latest.tar.gz

# 3. Verify application
curl https://melltool-backend.fly.dev/health

# 4. Test login and check data
```

---

## Best Practices

### 1. **3-2-1 Backup Rule**

- **3** copies of data
- **2** different storage media
- **1** off-site copy

**Example:**
1. Original data (Fly.io)
2. Local backup (`./backups/`)
3. Cloud storage (S3/Google Cloud)

### 2. **Backup Frequency**

| System Type | Recommendation |
|-------------|----------------|
| **Low Activity** | Daily backups, 30-day retention |
| **Normal Activity** | Daily backups, 60-day retention |
| **High Activity** | Every 6 hours, 90-day retention |
| **Critical** | Hourly backups + continuous replication |

### 3. **Retention Policy**

```bash
# Set retention days
export RETENTION_DAYS=30  # Keep 30 days
./scripts/backup-all.sh

# For long-term archival
export RETENTION_DAYS=365  # Keep 1 year
```

**Recommended retention:**
- Daily backups: 30 days
- Weekly backups: 90 days
- Monthly backups: 1 year
- Yearly backups: Forever (archive)

### 4. **Verification**

**Test your backups regularly:**

```bash
# Weekly: Verify backups exist
ls -lh ./backups/database/ | tail -7
ls -lh ./backups/files/ | tail -7

# Monthly: Test extraction
gunzip -t ./backups/database/database_backup_latest.sql.gz
tar -tzf ./backups/files/files_backup_latest.tar.gz > /dev/null

# Quarterly: Full restoration test on staging
```

### 5. **Security**

**Encrypt sensitive backups:**

```bash
# Encrypt database backup
gpg --symmetric --cipher-algo AES256 database_backup.sql.gz

# Decrypt when needed
gpg --decrypt database_backup.sql.gz.gpg > database_backup.sql.gz
```

**Secure cloud storage:**
- Enable server-side encryption (S3: SSE-KMS)
- Use IAM roles, not access keys
- Enable versioning
- Set up access logging

### 6. **Monitoring**

**Create backup monitoring script** (`scripts/check-backups.sh`):

```bash
#!/bin/bash
LATEST_DB=$(find ./backups/database -name "*.sql.gz" -mtime -1 | wc -l)
LATEST_FILES=$(find ./backups/files -name "*.tar.gz" -mtime -1 | wc -l)

if [ $LATEST_DB -eq 0 ] || [ $LATEST_FILES -eq 0 ]; then
    echo "WARNING: No recent backups found!"
    # Send alert (email, Slack, etc.)
    exit 1
fi

echo "✓ Backups are up to date"
```

---

## Disaster Recovery

### Scenario 1: Accidental Data Deletion

**Recovery Time: 5-15 minutes**

```bash
# Find backup from before deletion
ls -lh ./backups/database/

# Restore specific backup
./scripts/restore-database.sh ./backups/database/database_backup_20240101_120000.sql.gz
```

### Scenario 2: Complete Server Failure

**Recovery Time: 30-60 minutes**

1. **Create new Fly.io app:**
```bash
fly launch --name melltool-recovery
```

2. **Restore database:**
```bash
export FLY_APP_NAME=melltool-recovery
./scripts/restore-database.sh ./backups/database/database_backup_latest.sql.gz
```

3. **Restore files:**
```bash
./scripts/restore-files.sh ./backups/files/files_backup_latest.tar.gz
```

4. **Update DNS:**
```bash
# Point domain to new app
fly ips list -a melltool-recovery
```

### Scenario 3: Corrupted Database

**Recovery Time: 10-20 minutes**

```bash
# Stop application
fly scale count 0

# Restore from latest good backup
./scripts/restore-database.sh ./backups/database/database_backup_YYYYMMDD_HHMMSS.sql.gz

# Restart application
fly scale count 1
```

### Scenario 4: Ransomware Attack

**Recovery Time: 1-3 hours**

1. **Immediately disconnect** - Stop all applications
2. **Assess damage** - Check which data is affected
3. **Use oldest unaffected backup** - Don't use recent backups if they might be infected
4. **Restore to clean environment** - New server instance
5. **Verify integrity** - Check all data before going live
6. **Update security** - Patch vulnerabilities, rotate credentials

---

## Troubleshooting

### Backup Issues

**Error: "Could not fetch DATABASE_URL"**
```bash
# Solution: Login to Fly.io
fly auth login
fly secrets list -a melltool-backend
```

**Error: "pg_dump: command not found"**
```bash
# Solution: Install PostgreSQL client
brew install postgresql  # macOS
apt-get install postgresql-client  # Ubuntu
```

**Error: "Permission denied"**
```bash
# Solution: Make scripts executable
chmod +x scripts/*.sh
```

### Restoration Issues

**Error: "Database connection failed"**
```bash
# Check database status
fly status -a melltool-backend
fly pg connect -a melltool-backend

# Verify connection string
fly secrets list -a melltool-backend | grep DATABASE_URL
```

**Error: "Backup file corrupted"**
```bash
# Test integrity
gunzip -t backup_file.sql.gz

# If corrupted, use previous backup
ls -lh ./backups/database/
```

### Large Backup Files

**Backup takes too long:**
```bash
# Use parallel compression
export PIGZ_OPTIONS="-p 4"  # Use 4 CPU cores
pg_dump ... | pigz > backup.sql.gz
```

**Storage space issues:**
```bash
# Reduce retention period
export RETENTION_DAYS=7
./scripts/backup-all.sh

# Compress old backups further
find ./backups -name "*.sql.gz" -mtime +7 -exec gzip -9 {} \;
```

---

## Backup Checklist

### Daily
- [ ] Verify automated backup ran
- [ ] Check backup file sizes are reasonable
- [ ] Verify latest backups exist in cloud storage

### Weekly
- [ ] Test backup file integrity
- [ ] Review backup logs for errors
- [ ] Verify retention policy is working

### Monthly
- [ ] Perform test restoration on staging
- [ ] Review storage costs
- [ ] Update disaster recovery documentation
- [ ] Verify team knows recovery procedures

### Quarterly
- [ ] Full disaster recovery drill
- [ ] Review and update backup strategy
- [ ] Test all recovery scenarios
- [ ] Audit backup access controls

---

## Emergency Contacts

**Document your emergency contacts:**

```
Database Administrator: _______________
Fly.io Account Owner: _______________
Cloud Storage Admin: _______________
On-Call Support: _______________
```

---

## Additional Resources

- [Fly.io Backup Docs](https://fly.io/docs/postgres/managing/backup-and-restore/)
- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-best-practices.html)

---

**Remember**: The best backup is the one you can successfully restore!

Test your backups regularly. 🔄
