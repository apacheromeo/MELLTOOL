# Master-Variant Product System Guide

## 📚 Overview

The master-variant product system allows you to manage multiple product entries (with different SKUs/barcodes) that share the same physical stock. This is perfect for products that fit multiple models but are physically identical.

### Example Use Case:
- **1 physical HEPA filter** that fits 3 different vacuum models
- **3 separate product entries** (for different barcodes/model numbers)
- **All share the SAME stock** - when you sell one variant, stock decreases for all

---

## 🎯 Step-by-Step: Creating Master-Variant Products

### Step 1: Create a Master Product

First, create a normal product and mark it as a "Master Product":

#### Via API (Recommended):
```bash
POST /inventory/products
Content-Type: application/json

{
  "sku": "HEPA-UNIVERSAL",
  "name": "HEPA Filter - Universal",
  "nameTh": "ไส้กรอง HEPA",
  "description": "Universal HEPA filter",
  "categoryId": "cat-xxx",
  "brandId": "brand-xxx",
  "costPrice": 200,
  "sellPrice": 299,
  "stockQty": 10,
  "minStock": 2,
  "barcode": "HEPA-MASTER-001",
  "isMaster": true,      // ✅ Mark as master
  "isVisible": true      // Optional: Show/hide in product list
}
```

#### Via Frontend:
1. Go to **Inventory** page
2. Click **"Add Product"**
3. Fill in all product details
4. In the form, add these fields (you may need to manually add via API first)
5. Set `isMaster: true` when creating

---

### Step 2: Create Variant Products

Now create variants linked to the master. Each variant has its own SKU and barcode but shares the master's stock.

#### Method 1: Using the Master-Variant Management Panel (Easiest)

1. Go to **Inventory** page
2. Click the **purple "Master-Variant"** button in the header
3. Select your master product from the left panel
4. Click **"+ Add Variant"** in the right panel
5. Fill in the variant details:
   - **SKU** (required): e.g., `HEPA-X20-PLUS`
   - **Name** (required): e.g., `HEPA Filter for Xiaomi X20+`
   - **Thai Name** (optional): e.g., `ไส้กรอง HEPA สำหรับ Xiaomi X20+`
   - **Barcode** (optional): e.g., `8859012345678`
   - **Sell Price** (optional): Leave empty to inherit from master, or set different price
6. Click **"Create Variant"**

#### Method 2: Using API

```bash
POST /inventory/products/{masterId}/variants
Content-Type: application/json

{
  "sku": "HEPA-X20-PLUS",
  "name": "HEPA Filter for Xiaomi X20+",
  "nameTh": "ไส้กรอง HEPA สำหรับ Xiaomi X20+",
  "barcode": "8859012345678",
  "sellPrice": 299  // Optional - inherits from master if not provided
}
```

**Repeat for each variant:**
- HEPA for Xiaomi S20+
- HEPA for Xiaomi 1C
- etc.

---

## 🔄 How Stock Management Works

### Shared Inventory
All variants share the master product's stock:

```
Master: HEPA-UNIVERSAL (Stock: 10)
  ├── Variant 1: HEPA-X20-PLUS  → Shows Stock: 10
  ├── Variant 2: HEPA-S20-PLUS  → Shows Stock: 10
  └── Variant 3: HEPA-1C        → Shows Stock: 10
```

### When You Sell a Variant:
```
Customer scans barcode: 8859012345678 (X20+ variant)
System finds: HEPA-X20-PLUS (variant)
Decrements stock on: HEPA-UNIVERSAL (master)

Result:
Master: HEPA-UNIVERSAL (Stock: 10 → 8)
  ├── Variant 1: HEPA-X20-PLUS  → Shows Stock: 8 ✅
  ├── Variant 2: HEPA-S20-PLUS  → Shows Stock: 8 ✅
  └── Variant 3: HEPA-1C        → Shows Stock: 8 ✅
```

### When You Receive Stock:
```
Receiving inventory for: HEPA-UNIVERSAL (master)
Add 20 units

Result:
Master: HEPA-UNIVERSAL (Stock: 8 → 28)
  ├── Variant 1: HEPA-X20-PLUS  → Shows Stock: 28
  ├── Variant 2: HEPA-S20-PLUS  → Shows Stock: 28
  └── Variant 3: HEPA-1C        → Shows Stock: 28
```

**Important:**
- ✅ Always add/adjust stock on the **MASTER product**
- ❌ Never adjust stock directly on variant products
- Variant stock is always read from the master

---

## 👁️ Toggle Master Visibility

You can hide master products from the product listing while keeping variants visible.

### Use Case:
Hide "HEPA-UNIVERSAL" from your store/POS, but customers can still buy the specific variants (X20+, S20+, 1C).

### How to Toggle:

#### Via Master-Variant Management Panel:
1. Go to **Inventory** → Click **"Master-Variant"** button
2. Find your master product in the left panel
3. Click the **"Hide"** or **"Show"** button next to the product
4. Status will update immediately

#### Via API:
```bash
PATCH /inventory/products/{masterId}/visibility
Content-Type: application/json

{
  "isVisible": false  // true to show, false to hide
}
```

### What Happens When Hidden:
- ✅ Master product **does NOT appear** in product listings
- ✅ Variants **still appear** normally
- ✅ Stock management **still works** (update master stock)
- ✅ Reports and inventory counts **include** the master
- ✅ You can **still search** for the master by SKU

---

## 📊 Viewing Variants

### Via Master-Variant Management Panel:
1. Go to **Inventory** → Click **"Master-Variant"**
2. Click on a master product in the left panel
3. Right panel shows:
   - Master product info
   - Current stock level
   - List of all variants
   - Option to add new variants

### Via API:
```bash
GET /inventory/products/{masterId}/variants

Response:
{
  "master": {
    "id": "prod-123",
    "sku": "HEPA-UNIVERSAL",
    "name": "HEPA Filter - Universal",
    "stockQty": 10,
    "isVisible": false
  },
  "variants": [
    {
      "id": "prod-124",
      "sku": "HEPA-X20-PLUS",
      "name": "HEPA Filter for Xiaomi X20+",
      "barcode": "8859012345678",
      "sellPrice": 299
    },
    {
      "id": "prod-125",
      "sku": "HEPA-S20-PLUS",
      "name": "HEPA Filter for Xiaomi S20+",
      "barcode": "8859012345679",
      "sellPrice": 299
    }
  ],
  "total": 2
}
```

---

## 🛒 POS / Sales Workflow

### Scanning a Variant Barcode:
1. Customer brings "HEPA for X20+" to checkout
2. Staff scans barcode: `8859012345678`
3. System finds variant product: `HEPA-X20-PLUS`
4. Shows: "HEPA Filter for Xiaomi X20+" - ฿299 - Stock: 10
5. Add to cart and complete sale
6. Stock decrements from master (and all variants show updated stock)

### Important Notes:
- Each variant can have its **own barcode** for scanning
- Each variant can have its **own sell price** (or inherit from master)
- Stock is **always shared** across all variants
- Sales reports show which specific variant was sold (for analytics)

---

## 📝 Best Practices

### 1. Naming Convention
```
Master: "{Product} - Universal" or "{Product} - Master"
Variants: "{Product} for {Model}"

Example:
Master: "HEPA Filter - Universal"
Variants:
  - "HEPA Filter for Xiaomi X20+"
  - "HEPA Filter for Xiaomi S20+"
  - "HEPA Filter for Xiaomi 1C"
```

### 2. SKU Structure
```
Master: {CATEGORY}-{TYPE}-MASTER
Variants: {CATEGORY}-{TYPE}-{MODEL}

Example:
Master: HEPA-FILTER-MASTER
Variants:
  - HEPA-FILTER-X20
  - HEPA-FILTER-S20
  - HEPA-FILTER-1C
```

### 3. When to Use Master-Variant:
✅ Same physical product, different packaging/labeling
✅ One item fits multiple models
✅ Same product sold under different brands
✅ Shared inventory across SKUs

❌ Different sizes (S, M, L) - use separate products
❌ Different colors - use separate products
❌ Different specifications - use separate products

### 4. Stock Management:
- Always receive stock on the **master product**
- Set low stock alerts on the **master product**
- Use master SKU for stock adjustments
- Variants automatically reflect master's stock

---

## 🔍 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/inventory/products` | POST | Create product (set `isMaster: true`) |
| `/inventory/products/:id/visibility` | PATCH | Toggle master visibility |
| `/inventory/products/:id/variants` | POST | Create variant |
| `/inventory/products/:id/variants` | GET | Get all variants |
| `/inventory/products` | GET | List products (hidden masters filtered out) |

---

## ⚠️ Important Notes

1. **Database Migration Required:**
   When deploying, run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Permissions:**
   - Only `OWNER` and `MOD` roles can:
     - Create master products
     - Create variants
     - Toggle visibility
   - `STAFF` can still sell variants normally

3. **Reports & Analytics:**
   - Sales reports show which specific variant was sold
   - Inventory reports aggregate stock at master level
   - Low stock alerts based on master's `minStock` threshold

4. **Deleting Products:**
   - Deleting a master product will NOT delete variants (safe)
   - Variants will lose their `masterProductId` link
   - Consider hiding master instead of deleting

---

## 🎓 Example Scenario: Complete Workflow

### Setup Phase:
1. Create master: "HEPA Filter - Universal" (SKU: HEPA-MASTER, Stock: 50)
2. Create variant 1: "HEPA for X20+" (Barcode: 001)
3. Create variant 2: "HEPA for S20+" (Barcode: 002)
4. Create variant 3: "HEPA for 1C" (Barcode: 003)
5. Hide master from product list

### Daily Operations:
- **Customer scans** barcode 001 → System shows "HEPA for X20+" - ฿299
- **Sale completed** → Master stock: 50 → 49
- **All variants** now show stock: 49

### Receiving New Stock:
- **Supplier delivers** 100 units
- **Staff receives** stock on "HEPA-MASTER"
- **Master stock**: 49 → 149
- **All variants** automatically show: 149

### Inventory Check:
- **Physical count**: 149 units of HEPA filters
- **System shows**: Master has 149, each variant shows 149
- **Perfect match!** ✅

---

## 🆘 Troubleshooting

### Q: Variants showing wrong stock?
A: Stock is read from master. Check master product's `stockQty`.

### Q: Can't find master product in list?
A: It may be hidden. Check visibility status in Master-Variant panel.

### Q: How to track which variant sold better?
A: Sales reports show individual variant sales while stock aggregates at master level.

### Q: Can I change a regular product to a master?
A: Yes, update the product: set `isMaster: true` via API.

### Q: Can I link a variant to a different master?
A: Yes, update variant's `masterProductId` to point to new master.

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review API documentation
3. Contact development team

**Happy selling with shared inventory!** 🎉
