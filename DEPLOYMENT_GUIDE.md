# 🚀 Complete Deployment Guide - 2025 Best Practices

This guide will help you deploy your Inventory POS application with professional-grade security and performance. **No coding experience required** - just follow step by step.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Choosing Your Deployment Method](#2-choosing-your-deployment-method)
3. [Server Setup & Security](#3-server-setup--security)
4. [Database Setup](#4-database-setup)
5. [Application Deployment](#5-application-deployment)
6. [SSL/HTTPS Setup](#6-sslhttps-setup)
7. [Environment Configuration](#7-environment-configuration)
8. [Monitoring & Logging](#8-monitoring--logging)
9. [Backup Strategy](#9-backup-strategy)
10. [Post-Deployment Testing](#10-post-deployment-testing)
11. [Maintenance & Updates](#11-maintenance--updates)

---

## 1. Pre-Deployment Checklist

### ✅ What You'll Need:

- [ ] A server or cloud account (recommended: 2GB RAM minimum, 2 CPU cores, 20GB storage)
- [ ] A domain name (e.g., myinventory.com) - costs ~$10-15/year
- [ ] Credit/debit card for cloud services
- [ ] 2-3 hours of focused time
- [ ] A notepad to save passwords and secrets

### 📊 System Requirements:

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 2GB | 4GB+ |
| CPU | 2 cores | 4 cores |
| Storage | 20GB SSD | 50GB+ SSD |
| Network | 10 Mbps | 100 Mbps |

---

## 2. Choosing Your Deployment Method

### 🏆 Recommended: Docker + Cloud VPS (Best for 2025)

**Best for:** Most users, easy updates, scalability

**Platforms we recommend:**
1. **DigitalOcean** ($6-12/month) - Easiest for beginners
2. **AWS Lightsail** ($5-10/month) - Good balance
3. **Linode/Akamai** ($5-10/month) - Great performance
4. **Hetzner** (€4-8/month) - Best price in Europe

### 🎯 Why Docker?

- ✅ Easy updates with one command
- ✅ Isolated from server problems
- ✅ Same environment everywhere
- ✅ Easy backup and restore
- ✅ Industry standard in 2025

---

## 3. Server Setup & Security

### Step 3.1: Create Your Server

**For DigitalOcean (Recommended for Beginners):**

1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up (you'll get $200 free credit for 60 days)
3. Click "Create" → "Droplets"
4. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($12/month - 2GB RAM, 2 vCPU)
   - **Datacenter:** Closest to your customers
   - **Authentication:** SSH Key (we'll set this up)

5. **Important:** Select "SSH Key" and follow their guide to create one
   - On Windows: Use PuTTY or Windows Terminal
   - On Mac/Linux: Already built-in

6. Click "Create Droplet"
7. **Save your server IP address** (e.g., 123.45.67.89)

### Step 3.2: Connect to Your Server

**On Mac/Linux:**
```bash
ssh root@YOUR_SERVER_IP
```

**On Windows:**
- Download [PuTTY](https://putty.org)
- Enter your server IP
- Click "Open"
- Login as "root"

### Step 3.3: Secure Your Server (CRITICAL!)

Once connected, run these commands **one by one**:

```bash
# Update system
apt update && apt upgrade -y

# Create a non-root user (more secure)
adduser deployuser
# Follow prompts: Create a strong password, save it!

# Give admin privileges
usermod -aG sudo deployuser

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
# Type 'y' and press Enter

# Disable root login (security best practice)
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Install fail2ban (blocks hackers)
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

**⚠️ From now on, use `deployuser` instead of root:**

```bash
# Exit current session
exit

# Reconnect as deployuser
ssh deployuser@YOUR_SERVER_IP
```

### Step 3.4: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installations
docker --version
docker-compose --version

# Logout and login again for group changes
exit
ssh deployuser@YOUR_SERVER_IP
```

---

## 4. Database Setup

### Step 4.1: Generate Strong Passwords

**CRITICAL: Never use weak passwords!**

```bash
# Generate secure passwords (run these on your server)
# Save each output in your notepad!

echo "Database Password:" && openssl rand -base64 32
echo "Redis Password:" && openssl rand -base64 32
echo "JWT Secret:" && openssl rand -base64 64
echo "JWT Refresh Secret:" && openssl rand -base64 64
echo "Session Secret:" && openssl rand -base64 32
```

**📝 Example output (YOURS WILL BE DIFFERENT):**
```
Database Password: xK9mN2pQ8vL5jR3wT7yH4bG6nM1cV8zA
Redis Password: aB3dE5fG7hJ9kL2mN4pQ6rS8tU1vW3xY
JWT Secret: zA2xC4vB6nM8... (very long)
```

**⚠️ Save these in a safe place! You'll need them soon.**

### Step 4.2: Database Security Best Practices 2025

Your database will run in Docker (already configured), but here are security settings:

✅ Strong passwords (done above)
✅ Not exposed to internet (only accessible within Docker network)
✅ Regular backups (we'll set up)
✅ Encrypted connections
✅ Limited user permissions

---

## 5. Application Deployment

### Step 5.1: Get Your Code on the Server

```bash
# Install git if not present
sudo apt install git -y

# Clone your repository
cd ~
git clone https://github.com/YOUR_USERNAME/MELLTOOL.git
cd MELLTOOL

# If your repo is private, you'll need to authenticate
# GitHub may ask for username/password or token
```

### Step 5.2: Configure Environment Variables

**Backend Configuration:**

```bash
# Navigate to backend
cd ~/MELLTOOL/backend

# Copy example file
cp .env.example .env

# Edit the file
nano .env
```

**Now fill in your values** (use the passwords you generated earlier):

```env
# Copy from your notepad!
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD_HERE@postgres:5432/inventory_db?schema=public
REDIS_URL=redis://redis:6379

# Your generated secrets
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET_HERE
SESSION_SECRET=YOUR_SESSION_SECRET_HERE

# Your domain (or IP for testing)
FRONTEND_URL=https://your-domain.com
# For testing: http://YOUR_SERVER_IP:3000

NODE_ENV=production
PORT=3001
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

**Frontend Configuration:**

```bash
# Navigate to frontend
cd ~/MELLTOOL/frontend

# Copy example file
cp .env.example .env

# Edit the file
nano .env
```

```env
# Your backend URL
NEXT_PUBLIC_API_URL=https://api.your-domain.com
# For testing: http://YOUR_SERVER_IP:3001

NODE_ENV=production
PORT=3000
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 5.3: Update Docker Compose with Secrets

```bash
# Go to project root
cd ~/MELLTOOL

# Edit docker-compose
nano docker-compose.yml
```

**Update the postgres section** (line 8-10):

```yaml
environment:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: YOUR_DB_PASSWORD_HERE  # Use the password you generated
  POSTGRES_DB: inventory_db
```

**Update backend environment** (around line 42):

```yaml
environment:
  DATABASE_URL: postgresql://postgres:YOUR_DB_PASSWORD_HERE@postgres:5432/inventory_db
  REDIS_URL: redis://redis:6379
  NODE_ENV: production
  PORT: 3001
  JWT_SECRET: ${JWT_SECRET}  # Will read from .env
  FRONTEND_URL: ${FRONTEND_URL}
```

**Save and exit**

### Step 5.4: Build and Start Application

```bash
# Make sure you're in project root
cd ~/MELLTOOL

# Build all containers (this takes 5-10 minutes first time)
docker-compose build

# Start all services
docker-compose up -d

# Check if everything is running
docker-compose ps
```

**You should see 4 services running:**
- ✅ inventory_postgres
- ✅ inventory_redis
- ✅ inventory_backend
- ✅ inventory_frontend

### Step 5.5: Run Database Migrations

```bash
# Access backend container
docker-compose exec backend sh

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed initial data
npm run prisma:seed

# Exit container
exit
```

### Step 5.6: Create First Admin User

```bash
# Access backend container
docker-compose exec backend sh

# Create admin user manually
npx prisma studio
# This opens a database GUI

# Or use a migration/seed script
# Exit when done
exit
```

---

## 6. SSL/HTTPS Setup

### Why SSL is Critical in 2025:

- ✅ Google requires it for SEO
- ✅ Browsers show warnings without it
- ✅ Required for iPad/mobile access
- ✅ Encrypts sensitive data
- ✅ **FREE with Let's Encrypt!**

### Step 6.1: Point Domain to Server

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Find "DNS Management" or "DNS Settings"
3. Add these records:

```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          300
A       www     YOUR_SERVER_IP          300
A       api     YOUR_SERVER_IP          300
```

4. Wait 5-30 minutes for DNS to propagate
5. Test: `ping your-domain.com` (should show your server IP)

### Step 6.2: Install Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Stop it for now
sudo systemctl stop nginx
```

### Step 6.3: Install Certbot (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Follow prompts:
# - Enter email (for renewal reminders)
# - Agree to terms
# - Choose option 2: Redirect HTTP to HTTPS
```

### Step 6.4: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/inventory
```

**Paste this configuration:**

```nginx
# API Backend
server {
    listen 80;
    listen [::]:80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;

    # SSL managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers (2025 best practices)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 10M;
}

# Frontend Application
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL managed by Certbot
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Save and exit**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/inventory /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If OK, restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 6.5: Update Environment Variables

```bash
# Update backend .env
nano ~/MELLTOOL/backend/.env
```

Change:
```env
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

```bash
# Update frontend .env
nano ~/MELLTOOL/frontend/.env
```

Change:
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

```bash
# Restart containers to apply changes
cd ~/MELLTOOL
docker-compose restart
```

---

## 7. Environment Configuration

### Security Checklist for Production:

- [ ] All passwords are strong (32+ characters)
- [ ] JWT secrets are unique and strong (64+ characters)
- [ ] HTTPS is enabled
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Database is not exposed to internet
- [ ] SSH uses key authentication only
- [ ] Firewall is configured
- [ ] Fail2ban is running

### Verify Your Configuration:

```bash
# Check if services are running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend

# Check Nginx
sudo systemctl status nginx
```

---

## 8. Monitoring & Logging

### Step 8.1: Set Up Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/inventory
```

```
/home/deployuser/MELLTOOL/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deployuser deployuser
    sharedscripts
}
```

### Step 8.2: Install Monitoring Tools

**Option A: Simple - Uptime monitoring**

Use free services:
- [UptimeRobot](https://uptimerobot.com) - Free, monitors if site is up
- [BetterStack](https://betterstack.com) - Free tier, beautiful dashboard

**Setup UptimeRobot:**
1. Sign up at uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: `https://your-domain.com`
4. Interval: 5 minutes
5. Enable email alerts

**Option B: Advanced - Full monitoring (Recommended)**

```bash
# Install Docker-based monitoring stack
cd ~/MELLTOOL
mkdir monitoring
cd monitoring

# Create docker-compose for monitoring
nano docker-compose-monitoring.yml
```

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3100:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

```bash
# Start monitoring stack
docker-compose -f docker-compose-monitoring.yml up -d

# Access Grafana at http://YOUR_SERVER_IP:3100
# Default login: admin / CHANGE_ME_STRONG_PASSWORD
```

### Step 8.3: Set Up Alerts

**Email Alerts for Critical Events:**

```bash
# Install mailutils
sudo apt install mailutils -y

# Create alert script
nano ~/alert.sh
```

```bash
#!/bin/bash

# Alert script for critical events
EMAIL="your-email@gmail.com"
SUBJECT="[ALERT] Inventory System"

# Check if Docker containers are running
if ! docker-compose -f ~/MELLTOOL/docker-compose.yml ps | grep -q "Up"; then
    echo "Some containers are down!" | mail -s "$SUBJECT - Containers Down" $EMAIL
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is above 80%: ${DISK_USAGE}%" | mail -s "$SUBJECT - Disk Space" $EMAIL
fi
```

```bash
# Make executable
chmod +x ~/alert.sh

# Add to crontab (runs every hour)
crontab -e
```

Add this line:
```
0 * * * * /home/deployuser/alert.sh
```

---

## 9. Backup Strategy

### Step 9.1: Database Backup Script

```bash
# Create backup directory
mkdir -p ~/backups/database

# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash

# Database backup script
BACKUP_DIR="/home/deployuser/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="inventory_db"
DB_USER="postgres"
DB_PASSWORD="YOUR_DB_PASSWORD_HERE"  # Replace with your actual password

# Create backup
docker exec inventory_postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Optional: Upload to cloud storage (S3, Google Drive, etc.)
# aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" s3://your-bucket/backups/

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Test the backup
./backup-db.sh

# Schedule daily backups at 2 AM
crontab -e
```

Add:
```
0 2 * * * /home/deployuser/backup-db.sh >> /home/deployuser/backup.log 2>&1
```

### Step 9.2: Application Files Backup

```bash
# Create full backup script
nano ~/backup-full.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/deployuser/backups/full"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/deployuser/MELLTOOL"

mkdir -p $BACKUP_DIR

# Backup uploads and important files
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" \
    -C "$APP_DIR/backend" uploads

# Backup environment files (encrypted)
tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" \
    -C "$APP_DIR" backend/.env frontend/.env docker-compose.yml

# Encrypt the config backup
gpg --symmetric --cipher-algo AES256 "$BACKUP_DIR/config_$TIMESTAMP.tar.gz"
rm "$BACKUP_DIR/config_$TIMESTAMP.tar.gz"

# Keep last 30 days
find $BACKUP_DIR -name "*.tar.gz*" -mtime +30 -delete

echo "Full backup completed: $TIMESTAMP"
```

```bash
chmod +x ~/backup-full.sh

# Weekly backups on Sunday at 3 AM
crontab -e
```

Add:
```
0 3 * * 0 /home/deployuser/backup-full.sh >> /home/deployuser/backup.log 2>&1
```

### Step 9.3: Backup to Cloud (Recommended)

**Using AWS S3:**

```bash
# Install AWS CLI
sudo apt install awscli -y

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region (ap-southeast-1), Format (json)

# Update backup script to include S3 upload
nano ~/backup-db.sh
```

Add at the end:
```bash
# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" \
    s3://your-bucket-name/inventory-backups/database/
```

### Step 9.4: Restore from Backup

**To restore database:**

```bash
# List available backups
ls -lh ~/backups/database/

# Restore from specific backup
gunzip -c ~/backups/database/backup_20250107_020000.sql.gz | \
    docker exec -i inventory_postgres psql -U postgres -d inventory_db
```

---

## 10. Post-Deployment Testing

### Step 10.1: Health Checks

```bash
# Test backend health
curl https://api.your-domain.com/health

# Should return: {"status":"ok"}

# Test frontend
curl -I https://your-domain.com

# Should return: HTTP/2 200
```

### Step 10.2: Functional Testing

Open your browser and test:

- [ ] Can access https://your-domain.com
- [ ] Login page loads
- [ ] Can login with credentials
- [ ] Can navigate to POS
- [ ] Can view products
- [ ] Can create a test order
- [ ] Can scan QR code (using phone)
- [ ] Can upload product image
- [ ] Can view reports
- [ ] All pages load within 2 seconds

### Step 10.3: Security Testing

```bash
# Test SSL rating (should be A or A+)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Check security headers
curl -I https://your-domain.com | grep -i "strict-transport"

# Test CORS
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.your-domain.com/health
# Should NOT allow evil.com
```

### Step 10.4: Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API performance (100 requests, 10 concurrent)
ab -n 100 -c 10 https://api.your-domain.com/health

# Should handle >100 requests per second
```

### Step 10.5: Load Testing on iPad

1. Open Safari on iPad
2. Go to https://your-domain.com
3. Test POS functionality:
   - Select categories
   - Add products to cart
   - Scan QR codes
   - Process order
   - Verify stock deduction

---

## 11. Maintenance & Updates

### Daily Tasks:
```bash
# Check if services are running
docker-compose -f ~/MELLTOOL/docker-compose.yml ps

# Check disk space
df -h

# Check recent logs
docker-compose -f ~/MELLTOOL/docker-compose.yml logs --tail=50
```

### Weekly Tasks:
```bash
# Check backup logs
tail -100 ~/backup.log

# Verify backups exist
ls -lh ~/backups/database/ | tail -10

# Check for updates
cd ~/MELLTOOL
git fetch
```

### Monthly Tasks:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd ~/MELLTOOL
docker-compose pull
docker-compose up -d

# Rotate logs
sudo logrotate -f /etc/logrotate.conf

# Review access logs
sudo tail -100 /var/log/nginx/access.log
```

### Updating Application Code:

```bash
# Go to project directory
cd ~/MELLTOOL

# Backup current version
cp docker-compose.yml docker-compose.yml.backup

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run any new migrations
docker-compose exec backend npx prisma migrate deploy

# Check if everything is working
docker-compose ps
docker-compose logs backend | tail -50
```

### Emergency Rollback:

```bash
# Stop current version
docker-compose down

# Restore from git
git reset --hard HEAD~1

# Restore docker-compose
cp docker-compose.yml.backup docker-compose.yml

# Rebuild and start
docker-compose build
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Problem: Can't connect to server

```bash
# Check if SSH is running
sudo systemctl status ssh

# Check firewall
sudo ufw status

# Re-enable SSH
sudo ufw allow OpenSSH
```

### Problem: Docker containers won't start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Restart Docker
sudo systemctl restart docker
docker-compose up -d
```

### Problem: Database connection failed

```bash
# Check if postgres is running
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Verify DATABASE_URL in .env is correct
cat ~/MELLTOOL/backend/.env | grep DATABASE_URL
```

### Problem: SSL certificate error

```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

### Problem: High CPU/Memory usage

```bash
# Check resource usage
docker stats

# Check what's using resources
top
htop  # Install: sudo apt install htop

# Restart containers
docker-compose restart
```

---

## 📞 Getting Help

### Before Asking for Help:

1. Check logs: `docker-compose logs`
2. Check if services are running: `docker-compose ps`
3. Try restarting: `docker-compose restart`
4. Check this guide's troubleshooting section

### Log Files Locations:

- **Application logs:** `~/MELLTOOL/backend/logs/`
- **Nginx logs:** `/var/log/nginx/`
- **Docker logs:** `docker-compose logs [service_name]`
- **System logs:** `/var/log/syslog`

### Useful Commands:

```bash
# View all logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Enter a container
docker-compose exec backend sh
docker-compose exec frontend sh

# Restart specific service
docker-compose restart backend

# Check Docker disk usage
docker system df
```

---

## 🎉 Congratulations!

You now have a production-ready, secure inventory POS system deployed with 2025 best practices!

### What You've Achieved:

✅ Secure server with firewall and fail2ban
✅ SSL/HTTPS encryption
✅ Professional-grade deployment with Docker
✅ Automated backups
✅ Monitoring and alerts
✅ Modern security headers
✅ Rate limiting
✅ Log rotation
✅ Easy update process

### Recommended Next Steps:

1. **Test everything thoroughly** with real users
2. **Set up regular backup tests** (restore from backup monthly)
3. **Monitor your logs** for unusual activity
4. **Keep your system updated** (weekly checks)
5. **Document any customizations** you make
6. **Set calendar reminders** for maintenance tasks

### Pro Tips for 2025:

- 📱 Use mobile monitoring apps (UptimeRobot has an app)
- 🔐 Enable 2FA on all admin accounts
- 📊 Set up analytics to understand usage patterns
- 🔄 Consider implementing CI/CD for automatic updates
- 🌍 Use a CDN (Cloudflare) for better global performance
- 💾 Test your backups every month
- 🔍 Set up error tracking with Sentry
- 📈 Monitor your costs monthly

---

**Last Updated:** January 2025
**Difficulty:** Beginner-Friendly
**Time to Complete:** 2-3 hours
**Estimated Monthly Cost:** $12-25

---

Need help? Check the troubleshooting section or review the logs!
