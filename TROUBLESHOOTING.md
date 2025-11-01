# 🔧 Troubleshooting Guide - StockFlow

## Common Issues and Solutions

---

## 🚫 Issue: "Cannot connect to backend" or API calls failing

### Symptoms:
- Dashboard shows "Backend not running"
- Error messages about failed API calls
- Pages show error states

### Solutions:

1. **Check if backend is running:**
```bash
# In a terminal, navigate to backend folder
cd backend

# Start the backend
npm run start:dev
```

2. **Verify backend URL:**
- Backend should be running on `http://localhost:3001`
- Check if you can access `http://localhost:3001/health` in your browser
- Should return: `{"status":"ok"}`

3. **Check environment variables:**
Frontend `.env.local` should have:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **CORS Issues:**
Backend should allow frontend origin. Check `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

---

## 🚫 Issue: "No products/categories/brands showing"

### Symptoms:
- Empty dropdowns in forms
- "No products found" message
- Empty inventory page

### Solutions:

1. **Database not seeded:**
```bash
cd backend
npm run prisma:seed
```

2. **Create data manually via API:**
Using the Swagger docs at `http://localhost:3001/api/docs`:
- Create categories first
- Create brands
- Then create products

3. **Check database connection:**
```bash
cd backend
npx prisma studio
```
This opens a database viewer to check if data exists.

---

## 🚫 Issue: Frontend not loading at all

### Symptoms:
- Blank page
- "Cannot GET /" error
- Port already in use

### Solutions:

1. **Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

2. **Dependencies not installed:**
```bash
cd frontend
rm -rf node_modules
npm install
```

3. **Clear Next.js cache:**
```bash
cd frontend
rm -rf .next
npm run dev
```

---

## 🚫 Issue: "Module not found" errors

### Symptoms:
- TypeScript errors about missing modules
- Import errors in console

### Solutions:

1. **Install missing dependencies:**
```bash
cd frontend
npm install
```

2. **Check TypeScript paths:**
Verify `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

3. **Restart dev server:**
```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🚫 Issue: Buttons not working or doing nothing

### Symptoms:
- Clicking buttons has no effect
- Forms don't submit
- Navigation doesn't work

### Solutions:

1. **Check browser console:**
- Open DevTools (F12)
- Look for JavaScript errors
- Check Network tab for failed requests

2. **Verify API client:**
Make sure `src/lib/api.ts` exists and is properly configured.

3. **Check if JavaScript is disabled:**
- The app requires JavaScript to work
- Enable JavaScript in browser settings

---

## 🚫 Issue: "401 Unauthorized" errors

### Symptoms:
- API calls return 401 status
- "Unauthorized" error messages

### Solutions:

1. **Authentication not implemented yet:**
The current version doesn't require authentication for development.
Backend guards might be enabled - check `backend/src/modules/*/controllers`.

2. **Disable auth guards temporarily:**
Comment out `@UseGuards(JwtAuthGuard)` in controllers for development.

3. **Implement login:**
Use the auth endpoints to get a token:
```typescript
await api.login('user@example.com', 'password')
```

---

## 🚫 Issue: Database connection errors

### Symptoms:
- "Can't reach database server" errors
- Prisma connection errors

### Solutions:

1. **Check PostgreSQL is running:**
```bash
# If using Docker
docker ps

# If using local PostgreSQL
brew services list  # macOS
systemctl status postgresql  # Linux
```

2. **Verify DATABASE_URL:**
Check `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/stockflow?schema=public"
```

3. **Run migrations:**
```bash
cd backend
npx prisma migrate dev
```

4. **Reset database (⚠️ deletes all data):**
```bash
cd backend
npx prisma migrate reset
```

---

## 🚫 Issue: Styling looks broken

### Symptoms:
- No colors or spacing
- Layout is broken
- Tailwind classes not working

### Solutions:

1. **Rebuild Tailwind:**
```bash
cd frontend
rm -rf .next
npm run dev
```

2. **Check Tailwind config:**
Verify `tailwind.config.ts` exists and has correct content paths:
```typescript
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
]
```

3. **Verify globals.css is imported:**
Check `src/app/layout.tsx` imports `./globals.css`

---

## 🚫 Issue: Forecasting features not working

### Symptoms:
- Predictions return errors
- No forecast data showing

### Solutions:

1. **Need historical data:**
AI forecasting requires some historical data. Create:
- Products
- Stock-in records
- Wait for some time or manually create historical records

2. **Check forecasting service:**
```bash
cd backend
# Check logs for forecasting errors
npm run start:dev
```

3. **Verify Redis is running:**
```bash
# Forecasting uses Redis for caching
# Check if Upstash Redis URL is configured
```

---

## 🚫 Issue: Shopee integration not working

### Symptoms:
- Can't connect Shopee shop
- Sync fails

### Solutions:

1. **Configure Shopee credentials:**
Add to `backend/.env`:
```env
SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
SHOPEE_API_URL=https://partner.test-stable.shopeemobile.com
```

2. **Complete OAuth flow:**
Use the Shopee auth endpoints to get shop tokens.

3. **Check Shopee API status:**
Verify Shopee API is accessible and credentials are valid.

---

## 🚫 Issue: Performance is slow

### Symptoms:
- Pages load slowly
- API calls take long time
- UI feels sluggish

### Solutions:

1. **Enable caching:**
Make sure Redis is configured for caching:
```env
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

2. **Optimize database queries:**
Add indexes to frequently queried fields in Prisma schema.

3. **Reduce data fetching:**
Use pagination and limit results:
```typescript
api.getProducts({ page: 1, limit: 20 })
```

4. **Build for production:**
Development mode is slower:
```bash
cd frontend
npm run build
npm start
```

---

## 🚫 Issue: Mobile view is broken

### Symptoms:
- Layout doesn't work on mobile
- Menu doesn't open
- Elements overflow

### Solutions:

1. **Check viewport meta tag:**
Verify `src/app/layout.tsx` has:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

2. **Test responsive breakpoints:**
Use browser DevTools device emulation to test different screen sizes.

3. **Check Tailwind responsive classes:**
Make sure components use `md:`, `lg:` prefixes for responsive design.

---

## 📞 Getting More Help

### Check Logs:

**Frontend logs:**
- Browser console (F12 → Console tab)
- Terminal where `npm run dev` is running

**Backend logs:**
- Terminal where backend is running
- Check `backend/logs/` folder if configured

### Debug Mode:

**Enable verbose logging:**
```env
# backend/.env
LOG_LEVEL=debug
```

### Common Commands:

```bash
# Restart everything fresh
cd backend
npm run start:dev

# New terminal
cd frontend
npm run dev

# Check if ports are available
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# View database
cd backend
npx prisma studio

# Check API health
curl http://localhost:3001/health

# View API docs
open http://localhost:3001/api/docs
```

---

## 🆘 Still Having Issues?

1. **Check the documentation:**
   - `README.md` - Project overview
   - `QUICK_START.md` - Getting started guide
   - `docs/setup.md` - Detailed setup instructions
   - `WORKING_FEATURES.md` - Feature documentation

2. **Review the code:**
   - Check console for error messages
   - Look at Network tab in DevTools
   - Review backend logs

3. **Start fresh:**
   ```bash
   # Backend
   cd backend
   rm -rf node_modules dist
   npm install
   npx prisma migrate reset
   npm run start:dev
   
   # Frontend
   cd frontend
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

---

## ✅ Health Check Checklist

Run through this checklist to verify everything is working:

- [ ] PostgreSQL is running
- [ ] Backend starts without errors (`npm run start:dev`)
- [ ] Backend health endpoint works (`http://localhost:3001/health`)
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Can access frontend (`http://localhost:3000`)
- [ ] Landing page loads correctly
- [ ] Dashboard shows data
- [ ] Can navigate between pages
- [ ] Can create a product
- [ ] Can create a stock-in
- [ ] API calls work (check Network tab)

If all items are checked, your application is working correctly! ✨

---

**Need more help? Check the comprehensive documentation in the `/docs` folder!**



