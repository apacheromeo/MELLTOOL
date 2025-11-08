# MELLTOOL Database Schema Overview

**What tables will be created in your Supabase database**

When you deploy to Fly.io, Prisma will automatically create these tables:

---

## 📊 Database Tables

### 🔐 Authentication & Users
- **users** - User accounts (staff, owner, accountant)

### 📦 Inventory Management
- **categories** - Product categories
- **brands** - Product brands
- **products** - Product catalog
- **inventories** - Current stock levels

### 📥 Stock Operations
- **stock_ins** - Stock receiving records
- **stock_in_items** - Individual items in each stock-in

### 🛒 Sales & Orders
- **sales_orders** - Customer orders
- **sales_order_items** - Items in each order

### 🏪 Shopee Integration
- **shopee_shops** - Connected Shopee stores
- **shopee_products** - Products synced from Shopee
- **shopee_orders** - Orders from Shopee

### 🖨️ Printing
- **print_jobs** - Barcode printing history

### 💰 Financial
- **expenses** - Business expenses tracking

### ⚙️ Settings
- **app_settings** - Application configuration

---

## 🚀 How Tables Are Created

**Automatic Process:**

1. You deploy to Fly.io
2. Fly.io runs: `npx prisma migrate deploy`
3. Prisma creates all tables automatically
4. Your database is ready!

**No manual SQL needed!** ✨

---

## 🔍 Viewing Your Data

**After deployment, you can view your data in Supabase:**

1. Go to https://supabase.com/dashboard
2. Click your project "melltool"
3. Click "Table Editor" (left sidebar)
4. See all tables with data (like Excel!)

**Example tables you'll see:**
```
├── users
├── categories
├── brands
├── products
├── inventories
├── stock_ins
├── stock_in_items
├── sales_orders
├── sales_order_items
├── shopee_shops
├── shopee_products
├── shopee_orders
├── print_jobs
├── expenses
└── app_settings
```

---

## 📝 Example: Products Table

**Columns:**
- id (unique identifier)
- sku (product code)
- name (product name)
- nameTh (Thai name)
- description
- price
- cost
- categoryId (link to category)
- brandId (link to brand)
- barcode
- imageUrl
- isActive
- createdAt
- updatedAt

**You can:**
- ✓ Add products via your app
- ✓ View in Supabase Table Editor
- ✓ Edit manually if needed
- ✓ Export to CSV

---

## 🔗 Table Relationships

```
User
  ├─→ StockIn (created by user)
  ├─→ SalesOrder (handled by user)
  └─→ ShopeeShop (owned by user)

Category
  └─→ Products (in this category)

Brand
  └─→ Products (of this brand)

Product
  └─→ Inventory (stock level)
  └─→ StockInItem (receiving history)
  └─→ SalesOrderItem (sales history)

StockIn
  └─→ StockInItem (items received)

SalesOrder
  └─→ SalesOrderItem (items sold)
```

---

## 💡 What You Don't Need to Do

❌ Don't create tables manually
❌ Don't write SQL code
❌ Don't worry about structure
❌ Don't setup relationships

✅ Everything is automatic!
✅ Prisma handles all of it!
✅ Just deploy and it works!

---

## 🎯 Quick Facts

- **Total Tables**: ~15 tables
- **Created by**: Prisma migrations (automatic)
- **When**: During first deployment
- **Size**: ~1-2 MB (empty database)
- **Time to create**: ~30 seconds

---

## 🛠️ Manual Database Operations (Optional)

**If you ever need to run migrations manually:**

```bash
# SSH into your Fly.io machine
flyctl ssh console

# Run migrations
npx prisma migrate deploy

# View database
npx prisma studio
```

**But normally, this happens automatically!** 🎉

---

## 📱 Supabase Table Editor Tips

**After your app is deployed:**

1. **View Data**: Click any table to see records
2. **Add Data**: Click "Insert" to add manually
3. **Edit Data**: Click any cell to edit
4. **Delete Data**: Select row → Delete
5. **Filter**: Use the filter bar
6. **Sort**: Click column headers
7. **Export**: Download as CSV
8. **SQL**: Write custom queries

---

## 🔐 Data Protection

**Your data is protected by:**

1. **Application Level**: JWT authentication in backend
2. **Network Level**: HTTPS/TLS encryption
3. **Database Level**: PostgreSQL user permissions
4. **Platform Level**: Supabase security

**Optional but recommended:**
- Enable Row Level Security (RLS) in Supabase
- Set up backup strategy
- Monitor access logs

---

## ✅ Summary

**What happens when you deploy:**

```
1. Fly.io starts your backend
2. Runs: npx prisma migrate deploy
3. Prisma reads schema.prisma
4. Creates all 15+ tables in Supabase
5. Sets up relationships
6. Your app is ready!
```

**Time: ~1 minute**
**Effort: Zero** ✨

**Your database is production-ready from day one!**
