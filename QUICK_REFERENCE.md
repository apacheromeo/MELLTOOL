# 🚀 Quick Reference - StockFlow

## Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Access:** http://localhost:3000

---

## 📍 Page URLs

| Page | URL | Description |
|------|-----|-------------|
| **Home** | `/` | Landing page with system status |
| **Dashboard** | `/dashboard` | Metrics and overview |
| **Inventory** | `/inventory` | Product list |
| **Add Product** | `/inventory/new` | Create new product |
| **Stock In** | `/stock-in` | Stock-in records |
| **New Stock In** | `/stock-in/new` | Create stock-in |
| **Forecasting** | `/forecasting` | AI predictions |
| **Settings** | `/settings` | App preferences |

---

## 🔑 Key Features by Page

### Dashboard (`/dashboard`)
- View total products, low stock alerts, inventory value
- See recent stock-in activities
- Check Shopee shop connections
- Quick actions: Add Product, Stock In, Forecasting

### Inventory (`/inventory`)
- Search products by name, SKU, barcode
- View product cards with stock status
- Edit or delete products
- Navigate pages with pagination

### Add Product (`/inventory/new`)
- Enter bilingual product info (EN/TH)
- Select category and brand
- Set cost and sell prices
- Define stock levels (current, min, max)

### Stock In (`/stock-in`)
- View all stock-in records
- See status: Pending, Received, Cancelled
- Mark pending items as received
- View item details and costs

### New Stock In (`/stock-in/new`)
- Create multi-item stock-in
- Add/remove items dynamically
- Auto-calculate total cost
- Track supplier information

### AI Forecasting (`/forecasting`)
- Get 30-day stock predictions
- View low stock alerts
- See promotion forecasts (11/11, Black Friday)
- Check ABC analysis

### Settings (`/settings`)
- Change language (EN/TH)
- Toggle notifications
- Configure auto-sync
- View system info

---

## 🎨 Component Locations

```
frontend/src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # Dashboard
│   ├── inventory/
│   │   ├── page.tsx                # Product list
│   │   └── new/page.tsx            # Add product form
│   ├── stock-in/
│   │   ├── page.tsx                # Stock-in list
│   │   └── new/page.tsx            # New stock-in form
│   ├── forecasting/page.tsx        # AI forecasting
│   └── settings/page.tsx           # Settings
├── components/
│   └── Navigation.tsx              # Main navigation
└── lib/
    └── api.ts                      # API client
```

---

## 🔌 API Client Usage

```typescript
import { api } from '@/lib/api'

// Products
const products = await api.getProducts({ page: 1, limit: 20, search: 'motor' })
const product = await api.getProduct(productId)
await api.createProduct({ name: 'Test', sku: 'TEST-001', ... })
await api.updateProduct(productId, { stockQty: 100 })
await api.deleteProduct(productId)

// Dashboard
const overview = await api.getDashboardOverview()

// Stock In
const stockIns = await api.getStockIns({ limit: 50 })
await api.createStockIn({ reference: 'SI-001', items: [...] })
await api.receiveStockIn(stockInId)

// Forecasting
const prediction = await api.getStockPrediction(productId, 30)
const alerts = await api.getLowStockAlerts()
const insights = await api.getForecastingInsights()

// Categories & Brands
const categories = await api.getCategories()
const brands = await api.getBrands()
```

---

## 🎯 Common Tasks

### Add a New Product
1. Go to Inventory → Click "Add Product"
2. Fill in product name (EN required, TH optional)
3. Enter SKU (required)
4. Select category and brand
5. Set cost price (required)
6. Set stock levels
7. Click "Create Product"

### Create Stock-In
1. Go to Stock In → Click "New Stock In"
2. Enter reference number and supplier
3. Click "Add Item" for each product
4. Select product, quantity, and unit cost
5. Review total cost
6. Click "Create Stock In"
7. Later: Mark as "Received" when inventory arrives

### Get Stock Forecast
1. Go to AI Forecasting
2. Select a product from dropdown
3. Click "Predict"
4. View 30-day forecast and recommendations

### Search Products
1. Go to Inventory
2. Type in search bar (name, SKU, or barcode)
3. Results update automatically

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not connecting | Start backend: `cd backend && npm run start:dev` |
| Port 3000 in use | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| No products showing | Seed database: `cd backend && npm run prisma:seed` |
| Styling broken | Clear cache: `rm -rf .next && npm run dev` |
| Module not found | Reinstall: `rm -rf node_modules && npm install` |

---

## 📊 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

**Backend:**
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL

**Features:**
- AI Forecasting
- Shopee Integration
- Bilingual (EN/TH)
- Real-time Updates

---

## 🔗 Important Links

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs
- **Health Check:** http://localhost:3001/health
- **Prisma Studio:** `npx prisma studio` (in backend folder)

---

## 📝 Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** (`.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/stockflow
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
```

---

## 🎨 Color Palette

- **Primary Blue:** `#2563eb`
- **Secondary Purple:** `#9333ea`
- **Success Green:** `#16a34a`
- **Warning Yellow:** `#eab308`
- **Danger Red:** `#dc2626`
- **Gray:** `#6b7280`

---

## 📱 Responsive Breakpoints

- **Mobile:** `< 768px`
- **Tablet:** `768px - 1024px`
- **Desktop:** `> 1024px`

Use Tailwind classes: `md:`, `lg:`, `xl:`

---

## ⌨️ Useful Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Lint code

# Backend
npm run start:dev    # Start dev server
npm run build        # Build for production
npm start            # Run production build
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Run migrations

# Database
npx prisma migrate reset  # Reset database (⚠️ deletes data)
npx prisma generate      # Generate Prisma client
npx prisma db seed       # Seed database
```

---

## 📚 Documentation Files

- `README.md` - Project overview
- `QUICK_START.md` - Getting started
- `PROJECT_SUMMARY.md` - Complete features
- `WORKING_FEATURES.md` - All working buttons
- `TROUBLESHOOTING.md` - Common issues
- `frontend/FRONTEND_GUIDE.md` - Frontend docs
- `docs/architecture.md` - System design
- `docs/setup.md` - Setup guide
- `docs/deployment.md` - Deploy guide

---

## ✅ Status

✅ Frontend: Fully Functional  
✅ Backend: Complete API  
✅ Database: Schema Ready  
✅ AI Features: Implemented  
✅ Design: Modern & Sleek  
✅ Mobile: Responsive  
✅ Documentation: Complete  

**All buttons work! Ready to use! 🚀**

---

**Built with ❤️ for Thai E-commerce Success**



