# 🚀 Deployment Quick Start Guide

**For beginners with no coding experience - Get deployed in 30 minutes**

---

## 📱 What You're Deploying

A complete iPad-optimized POS (Point of Sale) system with:
- ✅ Staff authentication & login
- ✅ Product management
- ✅ Order fulfillment with QR scanning
- ✅ Camera barcode scanner
- ✅ Product image uploads
- ✅ Automatic stock management
- ✅ Sales reports

---

## 🎯 Choose Your Method

### Option 1: Test on Your Computer (10 minutes)
**Best for:** Testing, learning how it works
**Cost:** Free
**Access:** Only from your computer

### Option 2: Deploy to Cloud (30 minutes - Recommended)
**Best for:** Real business use, access from anywhere
**Cost:** $6-12/month
**Access:** From anywhere with internet

---

## 🏠 Option 1: Test on Your Computer

### Requirements:
- Computer with 4GB RAM
- Internet connection

### Step 1: Install Docker Desktop

**Windows/Mac:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Wait for it to say "Docker is running"

**Linux:**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo apt install docker-compose -y
```

### Step 2: Get the Code

**Option A: With Git (if you have it):**
```bash
git clone https://github.com/YOUR_USERNAME/MELLTOOL.git
cd MELLTOOL
```

**Option B: Without Git:**
1. Go to your GitHub repository
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file
5. Open terminal/command prompt in that folder

### Step 3: Start Everything

**On Windows (PowerShell or Command Prompt):**
```powershell
docker-compose up -d
```

**On Mac/Linux (Terminal):**
```bash
docker-compose up -d
```

**Wait 2-3 minutes...**

### Step 4: Open Your Application

Open your web browser and go to:
- **Main App:** http://localhost:3000
- **API:** http://localhost:3001/health (should show "ok")

### Step 5: Create Admin User

The database needs an admin user. Run this:
```bash
docker-compose exec backend npx prisma studio
```

This opens a database editor. Create a user with:
- email: admin@test.com
- name: Admin
- role: OWNER

### To Stop Everything:
```bash
docker-compose down
```

---

## ☁️ Option 2: Deploy to Cloud (Recommended)

### What You'll Need:
- Credit/debit card ($6-12/month)
- 1-2 hours of time
- A domain name (optional, $10-15/year)

### Step-by-Step Cloud Deployment

#### Part 1: Get a Server (10 minutes)

1. **Sign up for DigitalOcean**
   - Go to https://digitalocean.com
   - Create account (get $200 free credit!)

2. **Create a Droplet (Server)**
   - Click "Create" → "Droplets"
   - Choose:
     - **Image:** Ubuntu 22.04 LTS
     - **Plan:** Basic → $12/month (2GB RAM)
     - **Datacenter:** Choose closest to your location
   - **Important:** Click "New SSH Key"
     - Click "Show me how" and follow their guide
   - Click "Create Droplet"
   - **Write down your server's IP address!**

#### Part 2: Connect to Your Server (5 minutes)

**On Mac/Linux:**
Open Terminal and type:
```bash
ssh root@YOUR_SERVER_IP
# Replace YOUR_SERVER_IP with the IP from DigitalOcean
```

**On Windows:**
1. Download PuTTY from https://putty.org
2. Enter your server IP
3. Click "Open"
4. Login as "root"

#### Part 3: Secure Your Server (5 minutes)

Once connected, copy and paste these commands **one by one**:

```bash
# Update system
apt update && apt upgrade -y

# Create non-root user
adduser deployuser
# Create a password when asked and remember it!

# Give admin rights
usermod -aG sudo deployuser

# Install Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y

# Add user to docker group
usermod -aG docker deployuser

# Set up firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
# Type 'y' when asked

# Disable root login (security!)
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
```

Now disconnect and reconnect as the new user:
```bash
exit
ssh deployuser@YOUR_SERVER_IP
```

#### Part 4: Deploy Your Application (10 minutes)

```bash
# Get the code
git clone https://github.com/YOUR_USERNAME/MELLTOOL.git
cd MELLTOOL

# Generate secure secrets
./scripts/generate-secrets.sh
```

**IMPORTANT:** You'll see a bunch of passwords. **Copy them all** to a notepad! You'll need them in the next step.

```bash
# Create configuration file
cp .env.production.example .env

# Edit the file
nano .env
```

Now fill in your secrets (use the ones from generate-secrets.sh):

1. Find lines with `CHANGE_ME`
2. Replace with your secrets
3. **Minimum required:**
   - `POSTGRES_PASSWORD` - Your database password
   - `JWT_SECRET` - Your JWT secret
   - `JWT_REFRESH_SECRET` - Different from JWT_SECRET!
   - `SESSION_SECRET` - Your session secret
   - `REDIS_PASSWORD` - Your Redis password

4. **Press `Ctrl+X`, then `Y`, then `Enter` to save**

```bash
# Secure the file
chmod 600 .env

# Deploy everything!
./scripts/deploy.sh
```

This will take 5-10 minutes. It will:
- ✅ Build all containers
- ✅ Start database
- ✅ Start backend
- ✅ Start frontend
- ✅ Run migrations

#### Part 5: Access Your System

**Temporary access (using IP):**
```
http://YOUR_SERVER_IP:3000
```

**For production (with domain):**
Continue to Part 6

#### Part 6: Add Your Domain (Optional, 15 minutes)

**Buy a domain:**
- Namecheap.com ($10-15/year)
- GoDaddy.com
- Google Domains

**Point domain to server:**
1. In your domain settings, find "DNS Management"
2. Add these records:
   - Type: A, Name: @, Value: YOUR_SERVER_IP
   - Type: A, Name: api, Value: YOUR_SERVER_IP
3. Wait 5-30 minutes

**Set up HTTPS (free SSL):**
```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Get free SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose option 2 (redirect to HTTPS)
```

**Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/inventory
```

Paste this (replace your-domain.com):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    client_max_body_size 10M;
}
```

Save and exit (`Ctrl+X`, `Y`, `Enter`), then:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/inventory /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Update your .env files
nano ~/MELLTOOL/backend/.env
# Change FRONTEND_URL to https://your-domain.com

nano ~/MELLTOOL/frontend/.env
# Change NEXT_PUBLIC_API_URL to https://api.your-domain.com

# Restart containers
cd ~/MELLTOOL
docker-compose restart
```

#### Part 7: Set Up Backups (5 minutes)

```bash
# Test backup
./scripts/backup.sh

# Schedule daily backups
crontab -e
# Press '1' to choose nano

# Add this line:
0 2 * * * /home/deployuser/MELLTOOL/scripts/backup.sh

# Save (Ctrl+X, Y, Enter)
```

---

## ✅ Post-Deployment Checklist

Test everything:

- [ ] Can access login page
- [ ] Can login (create admin user if needed)
- [ ] Can view products page
- [ ] Can create a test product
- [ ] Can upload product image
- [ ] Can create a test order
- [ ] Camera scanner works on iPad/phone
- [ ] All pages load fast

---

## 🔧 Useful Commands

### Check if everything is running:
```bash
cd ~/MELLTOOL
docker-compose ps
```

### View logs:
```bash
docker-compose logs -f
docker-compose logs backend  # Just backend
```

### Restart everything:
```bash
docker-compose restart
```

### Update application:
```bash
cd ~/MELLTOOL
git pull
./scripts/deploy.sh
```

### Create backup:
```bash
./scripts/backup.sh
./scripts/backup.sh --full  # Include files
```

### Restore from backup:
```bash
./scripts/restore.sh ~/backups/database/backup_XXXXXX.sql.gz
```

### Check system health:
```bash
./scripts/health-check.sh
```

---

## 🆘 Common Problems

### Can't connect to server
```bash
# Check if running
docker-compose ps

# Restart
docker-compose restart
```

### "Permission denied"
```bash
chmod +x scripts/*.sh
```

### Port already in use
```bash
# Change ports in docker-compose.yml
nano docker-compose.yml
# Change "3001:3001" to "3002:3001"
```

### Forgot admin password
```bash
# Reset via database
docker-compose exec backend npx prisma studio
# Update user password in Users table
```

---

## 📚 What's Next?

1. **Read the full guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Set up monitoring:** Use UptimeRobot.com (free)
3. **Train your staff:** Show them how to use POS
4. **Test everything:** Create products, process orders
5. **Set up regular backups:** Already done if you followed Part 7!

---

## 🎉 Success!

Your POS system is now live!

**Access URLs:**
- **With domain:** https://your-domain.com
- **With IP:** http://YOUR_SERVER_IP:3000

**Admin Panel:**
- Login at /login
- Create products at /products
- Use POS at /pos

**For Help:**
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details
- Run `./scripts/health-check.sh` to diagnose issues
- Check logs with `docker-compose logs`

---

**Estimated Costs:**
- Server: $6-12/month (DigitalOcean)
- Domain: $10-15/year (optional)
- SSL: Free (Let's Encrypt)

**Total: ~$10/month**

---

Good luck with your deployment! 🚀
