# 💳 Sales / POS Module Documentation

## Overview

The Sales/POS (Point of Sale) module enables staff to create sales orders by scanning product barcodes, manage cart items, and complete transactions with automatic stock reduction.

---

## 🎯 Features

### Core Functionality
- ✅ **Barcode Scanning**: Scan products via USB scanner or manual input
- ✅ **Cart Management**: Add, update, remove items in real-time
- ✅ **Order Number Linking**: Scan order barcodes to link sales
- ✅ **Stock Validation**: Prevent overselling with real-time stock checks
- ✅ **Automatic Stock Cut**: Reduce inventory on sale confirmation
- ✅ **Multi-Payment Methods**: Cash, Card, Transfer, QR Code
- ✅ **Profit Tracking**: Real-time cost, price, and profit calculations
- ✅ **Sales History**: View past orders with filters
- ✅ **Daily Reports**: Revenue, profit, and items sold summaries
- ✅ **Bilingual UI**: Full English/Thai support

---

## 📊 Database Schema

### SalesOrder Table
```prisma
model SalesOrder {
  id            String       @id @default(cuid())
  orderNumber   String       @unique
  totalCost     Float        @default(0)
  totalPrice    Float        @default(0)
  profit        Float        @default(0)
  status        SalesStatus  @default(DRAFT)
  staffId       String
  staff         User         @relation(...)
  items         SalesItem[]
  confirmedAt   DateTime?
  canceledAt    DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  notes         String?
  paymentMethod String?
  customerName  String?
  customerPhone String?
}

enum SalesStatus {
  DRAFT      // Order in progress
  CONFIRMED  // Sale completed
  CANCELED   // Order canceled
  REFUNDED   // Order refunded
}
```

### SalesItem Table
```prisma
model SalesItem {
  id          String      @id @default(cuid())
  orderId     String
  order       SalesOrder  @relation(...)
  productId   String
  product     Product     @relation(...)
  sku         String      // Snapshot
  productName String      // Snapshot
  barcode     String?     // Snapshot
  quantity    Int
  unitCost    Float       // At time of sale
  unitPrice   Float       // At time of sale
  subtotal    Float       // quantity * unitPrice
  profit      Float       // (unitPrice - unitCost) * quantity
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

### DailySalesSummary Table
```prisma
model DailySalesSummary {
  id              String   @id @default(cuid())
  date            DateTime @unique @db.Date
  totalOrders     Int      @default(0)
  totalRevenue    Float    @default(0)
  totalCost       Float    @default(0)
  totalProfit     Float    @default(0)
  totalItemsSold  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 🔌 API Endpoints

### 1. Start New Sale
```http
POST /api/sales/start
Content-Type: application/json

{
  "orderNumber": "SO-20241026-0001",  // Optional
  "paymentMethod": "CASH",             // Optional
  "customerName": "John Doe",          // Optional
  "customerPhone": "0812345678",       // Optional
  "notes": "VIP customer"              // Optional
}

Response:
{
  "id": "clx...",
  "orderNumber": "SO-20241026-0001",
  "status": "DRAFT",
  "staffId": "staff-id",
  "staff": { "id": "...", "name": "Staff Name" },
  "totalCost": 0,
  "totalPrice": 0,
  "profit": 0,
  "items": [],
  "createdAt": "2024-10-26T10:00:00Z"
}
```

### 2. Add Item to Cart
```http
POST /api/sales/add-item
Content-Type: application/json

{
  "orderId": "clx...",
  "sku": "VM-2000",        // SKU or barcode
  "quantity": 1,           // Optional, default 1
  "unitPrice": 2200        // Optional, uses product price
}

Response: Updated order with items
```

### 3. Scan Barcode (Auto-detect)
```http
POST /api/sales/scan
Content-Type: application/json

{
  "orderId": "clx...",
  "barcodeValue": "8850123456789"
}

Response: 
- If product barcode: Adds item to cart
- If order barcode: Updates order number
```

### 4. Update Item
```http
PATCH /api/sales/item
Content-Type: application/json

{
  "itemId": "item-id",
  "quantity": 3,           // Optional
  "unitPrice": 2000        // Optional
}

Response: Updated order
```

### 5. Remove Item
```http
DELETE /api/sales/item/:itemId

Response: Updated order
```

### 6. Confirm Sale
```http
POST /api/sales/confirm
Content-Type: application/json

{
  "orderId": "clx...",
  "paymentMethod": "CASH",      // Optional
  "customerName": "John Doe",   // Optional
  "customerPhone": "0812345678" // Optional
}

Response: Confirmed order with status CONFIRMED
Note: Stock is automatically reduced for all items
```

### 7. Cancel Order
```http
POST /api/sales/:orderId/cancel

Response: Canceled order
Note: Can only cancel DRAFT orders
```

### 8. Get Order Details
```http
GET /api/sales/:orderId

Response: Order with items and staff details
```

### 9. Get Sales History
```http
GET /api/sales?page=1&limit=20&status=CONFIRMED&staffId=xxx&startDate=2024-10-01&endDate=2024-10-31

Response:
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 10. Get Daily Report
```http
GET /api/sales/report/daily?date=2024-10-26

Response:
{
  "date": "2024-10-26",
  "totalOrders": 25,
  "totalRevenue": 125000,
  "totalCost": 85000,
  "totalProfit": 40000,
  "totalItemsSold": 78,
  "orders": [...]
}
```

---

## 💻 Frontend Components

### 1. SalesPage (`/sales`)
Main POS interface with:
- Start sale button
- Barcode scanner
- Cart table
- Order summary
- Payment form

### 2. BarcodeScanner Component
```tsx
<BarcodeScanner
  isOpen={true}
  onScan={(barcode) => handleScan(barcode)}
  disabled={false}
/>
```

Features:
- Manual input field (auto-focus)
- USB scanner support (keyboard input)
- Last scanned display
- Camera placeholder (future)

### 3. CartTable Component
```tsx
<CartTable
  items={orderItems}
  onUpdateQuantity={(itemId, qty) => updateQty(itemId, qty)}
  onRemoveItem={(itemId) => removeItem(itemId)}
  disabled={false}
/>
```

Features:
- Editable quantities (inline editing)
- Remove item button
- Product details (name, SKU, barcode)
- Stock availability display
- Subtotal and profit per item

### 4. OrderSummary Component
```tsx
<OrderSummary
  order={currentOrder}
  onConfirm={(paymentData) => confirmSale(paymentData)}
  onCancel={() => cancelOrder()}
  disabled={false}
/>
```

Features:
- Order info (number, status, staff)
- Financial summary (cost, price, profit)
- Payment method selection
- Customer info fields
- Confirm/cancel buttons

### 5. SalesHistoryPage (`/sales/history`)
View past sales with:
- Daily report cards
- Status filters
- Order list with details
- View details button

---

## 🔄 Workflow

### Complete Sale Flow

1. **Staff clicks "Start New Sale"**
   ```
   → POST /sales/start
   → Creates DRAFT order
   → Opens scanner
   ```

2. **Scan or enter product barcodes**
   ```
   → POST /sales/scan or /sales/add-item
   → Validates stock availability
   → Adds to cart
   → Recalculates totals
   ```

3. **Adjust quantities if needed**
   ```
   → PATCH /sales/item
   → Updates quantity
   → Recalculates totals
   ```

4. **Click "Complete Sale"**
   ```
   → Shows payment form
   → Select payment method
   → Enter customer info (optional)
   ```

5. **Click "Confirm Payment"**
   ```
   → POST /sales/confirm
   → Validates stock again
   → Cuts stock for each item
   → Updates order status to CONFIRMED
   → Updates daily summary
   → Shows success message
   ```

### Stock Cut Logic

When sale is confirmed:
```typescript
// For each item in order:
await prisma.product.update({
  where: { id: item.productId },
  data: {
    stockQty: { decrement: item.quantity }
  }
})
```

**Validations:**
- ✅ Order must be in DRAFT status
- ✅ Order must have at least 1 item
- ✅ All items must have sufficient stock
- ✅ Transaction is atomic (all or nothing)

---

## 🎨 UI Features

### Barcode Scanner
- **Manual Input**: Type SKU/barcode and press Enter
- **USB Scanner**: Automatically inputs and submits
- **Auto-focus**: Input field stays focused for rapid scanning
- **Last Scanned**: Shows confirmation of last scan

### Cart Display
- **Product Info**: Name (EN/TH), SKU, barcode
- **Stock Info**: Current stock availability
- **Editable Qty**: Click quantity to edit inline
- **Remove Button**: Quick item removal
- **Profit Display**: Shows profit per item

### Order Summary
- **Real-time Totals**: Updates as items change
- **Profit Margin**: Shows percentage
- **Payment Options**: Cash, Card, Transfer, QR
- **Customer Fields**: Optional name and phone
- **Stock Warning**: Alerts before confirmation

---

## 🔐 Security & Validation

### Backend Validations
1. **Stock Availability**: Checked on add and confirm
2. **Order Status**: Only DRAFT orders can be modified
3. **Atomic Transactions**: Stock cuts use database transactions
4. **Price Snapshots**: Prices saved at time of sale
5. **Staff Tracking**: Every order linked to staff

### Frontend Validations
1. **Empty Cart**: Cannot confirm empty order
2. **Quantity Limits**: Must be positive integers
3. **Confirmation Dialogs**: For remove and cancel actions
4. **Error Handling**: User-friendly error messages
5. **Loading States**: Prevents double-submissions

---

## 📱 Barcode Support

### Supported Formats
- **Code-128**: Standard barcode format
- **EAN-13**: International product codes
- **Custom SKUs**: Any alphanumeric string

### USB Scanner Setup
1. Connect USB barcode scanner
2. Scanner acts as keyboard
3. Scan directly into input field
4. Press Enter or scanner auto-submits

### Future: Camera Scanning
Integration options:
- **html5-qrcode**: Web-based camera scanning
- **Quagga.js**: Advanced barcode detection
- **ZXing**: Multi-format support

---

## 📊 Reporting

### Daily Sales Summary
Auto-updated on each confirmed sale:
- Total orders count
- Total revenue (sum of totalPrice)
- Total cost (sum of totalCost)
- Total profit (revenue - cost)
- Total items sold

### Sales History Filters
- By status (DRAFT, CONFIRMED, CANCELED)
- By staff member
- By date range
- Pagination support

---

## 🔧 Configuration

### Environment Variables
```env
# No additional env vars required
# Uses existing database and auth config
```

### Order Number Format
```typescript
// Auto-generated format:
SO-YYYYMMDD-XXXX

// Example:
SO-20241026-0001
```

---

## 🚀 Future Enhancements

### Planned Features
1. **Receipt Printing**: PDF generation with jsbarcode
2. **Refund System**: Process returns and refunds
3. **Discount Support**: Apply discounts to items/orders
4. **Tax Calculation**: VAT/sales tax support
5. **Multi-currency**: Support multiple currencies
6. **Offline Mode**: PWA with offline capability
7. **Camera Scanning**: Browser camera integration
8. **Customer Management**: Save customer profiles
9. **Loyalty Points**: Track customer rewards
10. **Shift Reports**: Staff performance tracking

### Integration Points
- **Shopee Sync**: Mark items as sold on Shopee
- **Accounting**: Export to accounting software
- **Analytics**: Advanced sales analytics dashboard
- **Inventory Alerts**: Auto-reorder on low stock

---

## 🐛 Troubleshooting

### Common Issues

**1. "Product not found" error**
- Verify SKU/barcode exists in inventory
- Check spelling and format
- Ensure product is active

**2. "Insufficient stock" error**
- Check current stock quantity
- Reduce order quantity
- Restock product first

**3. USB scanner not working**
- Check USB connection
- Verify scanner is in keyboard mode
- Test in text editor first
- Check scanner settings

**4. Cannot confirm sale**
- Ensure cart has items
- Check all items have sufficient stock
- Verify order is in DRAFT status
- Check for error messages

---

## 📝 Code Examples

### Backend: Custom Sale Logic
```typescript
// Add custom validation
async confirmSale(dto: ConfirmSaleDto) {
  // Your custom logic here
  const order = await this.getOrderById(dto.orderId);
  
  // Example: Minimum order amount
  if (order.totalPrice < 100) {
    throw new BadRequestException('Minimum order is ฿100');
  }
  
  // Continue with confirmation...
  return this.salesService.confirmSale(dto);
}
```

### Frontend: Custom Scanner
```typescript
// Integrate with hardware scanner
useEffect(() => {
  const handleScan = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && scanBuffer.length > 0) {
      onScan(scanBuffer);
      setScanBuffer('');
    } else {
      setScanBuffer(prev => prev + event.key);
    }
  };
  
  window.addEventListener('keypress', handleScan);
  return () => window.removeEventListener('keypress', handleScan);
}, []);
```

---

## ✅ Testing Checklist

### Manual Testing
- [ ] Start new sale
- [ ] Scan product barcode
- [ ] Add item via manual input
- [ ] Update item quantity
- [ ] Remove item from cart
- [ ] Confirm sale with payment
- [ ] Verify stock was reduced
- [ ] Cancel draft order
- [ ] View sales history
- [ ] Check daily report
- [ ] Test with low stock
- [ ] Test with out-of-stock

### Edge Cases
- [ ] Empty cart confirmation
- [ ] Negative quantities
- [ ] Duplicate items
- [ ] Concurrent stock updates
- [ ] Network errors
- [ ] Large orders (100+ items)

---

## 📚 Additional Resources

- **Prisma Schema**: `/backend/prisma/schema.prisma`
- **Sales Service**: `/backend/src/modules/sales/sales.service.ts`
- **Sales Controller**: `/backend/src/modules/sales/sales.controller.ts`
- **Frontend Page**: `/frontend/src/app/sales/page.tsx`
- **API Client**: `/frontend/src/lib/api.ts`

---

**Built with ❤️ for Thai E-commerce Success**



