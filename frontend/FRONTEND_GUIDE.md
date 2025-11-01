# Frontend Guide - StockFlow Inventory Management

## 🎨 Overview

The frontend is built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, and features a modern, responsive design with bilingual support (English/Thai).

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Dashboard with metrics
│   │   ├── inventory/         # Product management
│   │   │   ├── page.tsx       # Product list
│   │   │   └── new/           # Add new product
│   │   ├── stock-in/          # Stock-in management
│   │   │   ├── page.tsx       # Stock-in list
│   │   │   └── new/           # Create stock-in
│   │   ├── forecasting/       # AI forecasting & predictions
│   │   └── settings/          # App settings
│   ├── components/            # Reusable components
│   │   └── Navigation.tsx     # Main navigation
│   └── lib/
│       └── api.ts             # API client for backend
├── public/                    # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend API running on `http://localhost:3001`

### Installation

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Create environment file:**
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=StockFlow
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📄 Available Pages

### 1. **Landing Page** (`/`)
- System status check
- Feature overview
- Quick links to main sections
- Bilingual descriptions

### 2. **Dashboard** (`/dashboard`)
- Key metrics (Total Products, Low Stock, Total Value, Health Score)
- Recent stock-in activities
- Connected Shopee shops
- Quick action cards

### 3. **Inventory** (`/inventory`)
- Product list with search
- Product cards with stock status
- Add, edit, delete products
- Pagination support

### 4. **Add Product** (`/inventory/new`)
- Bilingual product form (EN/TH)
- Category & brand selection
- Pricing (cost & sell price)
- Stock levels (current, min, max)
- Description fields

### 5. **Stock In** (`/stock-in`)
- List of stock-in records
- Status indicators (Pending, Received, Cancelled)
- Mark as received functionality
- Item details preview

### 6. **New Stock In** (`/stock-in/new`)
- Create stock-in records
- Add multiple items
- Auto-calculate total cost
- Supplier information

### 7. **AI Forecasting** (`/forecasting`)
- Stock prediction tool (30-day forecast)
- Low stock alerts
- Promotion day forecasting (11/11, Black Friday, etc.)
- ABC Analysis
- Trend analysis

### 8. **Settings** (`/settings`)
- Language selection (EN/TH)
- Notification preferences
- Auto-sync settings
- Shopee integration status
- System information

## 🎨 Design Features

### Modern UI Components
- **Glass morphism effects** for cards
- **Gradient backgrounds** for visual appeal
- **Smooth transitions** and hover effects
- **Responsive grid layouts**
- **Loading skeletons** for better UX
- **Empty states** with helpful messages
- **Error handling** with retry options

### Color Scheme
- Primary: Blue (`#2563eb`)
- Secondary: Purple (`#9333ea`)
- Success: Green (`#16a34a`)
- Warning: Yellow (`#eab308`)
- Danger: Red (`#dc2626`)

### Icons
Using emoji icons for simplicity and universal recognition:
- 📦 Products/Inventory
- 📊 Dashboard/Analytics
- 📥 Stock In
- 🤖 AI/Forecasting
- ⚙️ Settings
- 🛍️ Shopee

## 🔌 API Integration

The `api.ts` client handles all backend communication:

```typescript
import { api } from '@/lib/api'

// Example: Get products
const products = await api.getProducts({ page: 1, limit: 20 })

// Example: Create product
await api.createProduct({
  name: 'Product Name',
  sku: 'SKU-001',
  costPrice: 100,
  stockQty: 50,
  // ...
})

// Example: Get stock prediction
const prediction = await api.getStockPrediction(productId, 30)
```

### Available API Methods

**Auth:**
- `login(email, password)`
- `register(email, password, name)`
- `logout()`
- `getProfile()`

**Dashboard:**
- `getDashboardOverview()`
- `getDashboardMetrics()`
- `getRecentActivities()`

**Inventory:**
- `getProducts(params)`
- `getProduct(id)`
- `createProduct(data)`
- `updateProduct(id, data)`
- `deleteProduct(id)`
- `getCategories()`
- `getBrands()`

**Forecasting:**
- `getStockPrediction(productId, days)`
- `getPromotionForecast(data)`
- `getReorderPoint(productId)`
- `getForecastingInsights()`
- `getLowStockAlerts()`

**Stock In:**
- `getStockIns(params)`
- `createStockIn(data)`
- `receiveStockIn(id)`

**Shopee:**
- `getShopeeShops()`
- `syncShopeeCatalog(shopId)`
- `syncShopeeStock(shopId)`

## 🌐 Internationalization (i18n)

The app supports English and Thai languages:

- Product names: `name` (EN) and `nameTh` (TH)
- Descriptions: `description` (EN) and `descriptionTh` (TH)
- UI elements: Bilingual labels and placeholders
- Currency: Thai Baht (฿)

## 📱 Responsive Design

The UI is fully responsive with breakpoints:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

Features:
- Mobile navigation menu
- Responsive grid layouts
- Touch-friendly buttons
- Optimized for all screen sizes

## 🎯 Key Features

### 1. **Real-time Updates**
- Auto-refresh functionality
- Live status indicators
- Instant feedback on actions

### 2. **Smart Search**
- Search by name, SKU, or barcode
- Debounced search input
- Pagination support

### 3. **Form Validation**
- Required field validation
- Type checking
- User-friendly error messages

### 4. **Loading States**
- Skeleton loaders
- Progress indicators
- Disabled states during operations

### 5. **Error Handling**
- Graceful error messages
- Retry functionality
- Fallback UI states

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## 📦 Dependencies

**Core:**
- `next`: 14.x
- `react`: 18.x
- `typescript`: 5.x

**Styling:**
- `tailwindcss`: 3.x
- `postcss`: 8.x
- `autoprefixer`: 10.x

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
4. Deploy

### Docker
```bash
docker build -t stockflow-frontend .
docker run -p 3000:3000 stockflow-frontend
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to customize colors:
```typescript
theme: {
  extend: {
    colors: {
      primary: '#2563eb',
      secondary: '#9333ea',
      // Add your colors
    }
  }
}
```

### Fonts
Update `src/app/layout.tsx` to change fonts.

## 📝 Notes

- **Backend Required**: The frontend requires the backend API to be running
- **CORS**: Make sure backend CORS is configured to allow frontend origin
- **Environment Variables**: Use `.env.local` for local development
- **API Client**: All API calls go through the centralized `api.ts` client

## 🐛 Troubleshooting

### Frontend not loading
- Check if backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for errors

### API calls failing
- Verify backend is accessible
- Check CORS configuration
- Ensure correct API URL

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

## 🎉 Features Highlights

✅ Modern, sleek design with gradients and animations
✅ Fully responsive for mobile, tablet, and desktop
✅ Bilingual support (English/Thai)
✅ AI-powered forecasting and predictions
✅ Real-time inventory tracking
✅ Shopee integration ready
✅ Comprehensive error handling
✅ Loading states and skeletons
✅ Search and pagination
✅ Form validation
✅ Quick actions and shortcuts

---

**Built with ❤️ for Thai E-commerce Success**



