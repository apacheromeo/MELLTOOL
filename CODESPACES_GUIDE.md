# 🚀 CODESPACES QUICK START GUIDE
**Running MELLTOOL in GitHub Codespaces**

---

## ✅ GOOD NEWS!

The frontend server **DOES work** in Codespaces! Here's how to get it running properly:

---

## 🎯 QUICK START (Frontend Only Preview)

If you just want to see the frontend UI (without backend functionality):

### Step 1: Start Frontend
```bash
cd /home/user/MELLTOOL/frontend
npm run dev
```

Expected output:
```
✓ Ready in 3.2s
- Local: http://localhost:3000
```

### Step 2: Forward Port in Codespaces

1. Look for the **PORTS** tab at the bottom of VS Code
2. You should see port **3000** listed (auto-forwarded)
3. Click on the **globe icon** or **Open in Browser** next to port 3000
4. Your frontend will open in a new tab!

**That's it!** The frontend UI will load (though API calls will fail without backend).

---

## 🔧 FULL APP SETUP (Frontend + Backend)

To get the full app working with backend:

### Prerequisites Check
```bash
# Check if Docker is available (for database)
docker --version

# Check if services can run
which psql redis-cli
```

### Option A: Using Docker Compose (Easiest)

```bash
cd /home/user/MELLTOOL

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up
```

**Ports to forward in Codespaces:**
- Port **3000** - Frontend
- Port **3001** - Backend API
- Port **5432** - PostgreSQL (optional)
- Port **6379** - Redis (optional)

### Option B: Manual Setup (More Control)

#### 1. Set up environment variables

**Backend** (`/home/user/MELLTOOL/backend/.env`):
```bash
# Create .env file
cd /home/user/MELLTOOL/backend
cat > .env << 'EOF'
# Database (use mock for preview)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory_db"

# Supabase (optional - can skip for preview)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-key-here"

# Redis (optional - can skip for preview)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="development-secret-key-minimum-32-characters-long-for-testing"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Shopee (optional)
SHOPEE_PARTNER_ID="test"
SHOPEE_PARTNER_KEY="test"
SHOPEE_BASE_URL="https://partner.shopeemobile.com"
SHOPEE_REDIRECT_URI="http://localhost:3000/shopee/callback"
EOF
```

**Frontend** (`/home/user/MELLTOOL/frontend/.env.local`):
```bash
cd /home/user/MELLTOOL/frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
EOF
```

#### 2. Start PostgreSQL (if available)
```bash
# Using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=inventory_db \
  -p 5432:5432 \
  postgres:15-alpine

# Wait for it to start
sleep 5
```

#### 3. Start Redis (if available)
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 4. Setup Database
```bash
cd /home/user/MELLTOOL/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

#### 5. Start Backend
```bash
cd /home/user/MELLTOOL/backend
npm run start:dev
```

#### 6. Start Frontend (new terminal)
```bash
cd /home/user/MELLTOOL/frontend
npm run dev
```

#### 7. Forward Ports in Codespaces
- Go to **PORTS** tab
- Forward ports **3000** and **3001**
- Click on port 3000's globe icon to open app

---

## 🎨 PREVIEW WITHOUT FULL SETUP

If you don't want to set up databases, here's what you can preview:

### Static UI Preview (No Backend Needed)

1. **Start frontend only**:
```bash
cd /home/user/MELLTOOL/frontend
npm run dev
```

2. **Forward port 3000** in Codespaces

3. **What you can see**:
   - ✅ Login page UI
   - ✅ Dashboard layout
   - ✅ Inventory page design
   - ✅ Sales POS interface
   - ✅ All page layouts and components
   - ✅ Fixed UI bugs (stock percentage bars, etc.)

4. **What won't work** (requires backend):
   - ❌ Login functionality
   - ❌ Data loading
   - ❌ API calls

**This is perfect for reviewing UI fixes and layouts!**

---

## 🐛 TROUBLESHOOTING CODESPACES

### Issue: "npm run dev" starts but can't access

**Solution**:
1. Check PORTS tab at bottom of VS Code
2. Port 3000 should auto-forward
3. Click the globe icon next to port 3000
4. Or use the forwarded URL (looks like `https://xxx-3000.app.github.dev`)

### Issue: Port already in use

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Issue: Cannot connect to backend

**Solution**:
1. Make sure backend is running: `curl http://localhost:3001/api/docs`
2. Check PORTS tab - port 3001 should be forwarded
3. Update frontend .env.local with forwarded backend URL:
   ```
   NEXT_PUBLIC_API_URL=https://xxx-3001.app.github.dev
   ```

### Issue: Google Fonts warning

This is **not an error** - just a warning. The app will work fine with system fonts.
```
Failed to fetch font `Inter`.
Retrying...
```
**Ignore this** - it's a network issue in Codespaces, not a bug.

### Issue: Database connection failed

**Solution**:
1. Either set up Docker containers (see above)
2. Or use external database services:
   - Railway.app (free PostgreSQL)
   - Upstash (free Redis)
   - Update DATABASE_URL and REDIS_URL in .env

---

## 📱 ACCESSING YOUR APP IN CODESPACES

After starting the servers:

1. **Look at PORTS tab** (bottom panel in VS Code)
2. You'll see:
   ```
   Port    Address              Visibility
   3000    localhost:3000       Public
   3001    localhost:3001       Public
   ```

3. **To open frontend**:
   - Click globe icon next to port 3000
   - Or copy the forwarded URL

4. **To test backend API**:
   - Click globe icon next to port 3001
   - Add `/api/docs` to URL for Swagger UI

---

## 🎯 RECOMMENDED APPROACH FOR PREVIEW

**For quick UI preview** (recommended for Codespaces):

```bash
# Just start frontend
cd /home/user/MELLTOOL/frontend
npm run dev

# Then access via forwarded port 3000
```

**What you'll see:**
- All the **fixed UI components**
- **Stock percentage bars** displaying correctly
- **Inventory layouts**
- **Sales POS interface**
- **All visual improvements**

This is perfect for reviewing the bug fixes without needing full backend setup!

---

## 🚀 TESTING THE BUG FIXES

Even with just frontend running, you can verify:

✅ **Bug #4 - Stock Percentage Display**
- Open `/inventory` page
- See product cards with correct progress bars
- No division by zero errors

✅ **Bug #5 - Manual Product Addition UI**
- Open `/sales` page
- Click "Search Products" button
- UI modal appears correctly

✅ **General UI/UX**
- Navigation works
- Layouts are responsive
- All pages accessible

---

## 💡 SUMMARY

**Easiest for Codespaces:**
```bash
# Terminal 1: Frontend only
cd /home/user/MELLTOOL/frontend && npm run dev

# Then forward port 3000 in PORTS tab
# Click globe icon to open
```

**Full app (requires setup):**
```bash
# Use docker-compose
cd /home/user/MELLTOOL && docker-compose up

# Forward ports 3000 and 3001
```

---

## 📞 NEED HELP?

The app **IS working** - it's just about port forwarding in Codespaces!

1. Start the dev server: `npm run dev`
2. Check PORTS tab (bottom of VS Code)
3. Click globe icon next to port 3000
4. App opens in new tab! 🎉

---

**Last Updated**: 2025-11-07
**For**: GitHub Codespaces Environment
