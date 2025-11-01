import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';

// Simple module for testing
import { Module, Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';

// In-memory storage for sales orders
const salesOrders = new Map();
let orderCounter = 1;

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('dashboard/overview')
  getDashboardOverview() {
    return {
      inventory: {
        totalProducts: 150,
        lowStockCount: 12,
        totalValue: 458900,
        healthScore: 85,
      },
      stockIns: {
        recent: [
          {
            id: '1',
            reference: 'SI-2024-001',
            status: 'RECEIVED',
            user: { name: 'Admin User' },
            _count: { items: 5 },
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            reference: 'SI-2024-002',
            status: 'PENDING',
            user: { name: 'Staff User' },
            _count: { items: 3 },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      shopee: {
        shops: [
          {
            id: '1',
            shopName: 'My Vacuum Shop',
            shopRegion: 'TH',
            _count: { items: 45 },
            lastSyncAt: new Date().toISOString(),
          },
        ],
      },
    };
  }

  @Get('inventory/products')
  getProducts() {
    return {
      products: [
        {
          id: '1',
          name: 'Vacuum Motor V2000',
          nameTh: 'มอเตอร์เครื่องดูดฝุ่น V2000',
          sku: 'VM-2000',
          barcode: '8850123456789',
          costPrice: 1500,
          sellPrice: 2200,
          stockQty: 45,
          minStock: 10,
          maxStock: 100,
          brand: { name: 'Premium Motors' },
          category: { name: 'Motors' },
        },
        {
          id: '2',
          name: 'Vacuum Filter HEPA',
          nameTh: 'ไส้กรองเครื่องดูดฝุ่น HEPA',
          sku: 'VF-HEPA',
          barcode: '8850123456790',
          costPrice: 250,
          sellPrice: 450,
          stockQty: 120,
          minStock: 20,
          maxStock: 200,
          brand: { name: 'FilterPro' },
          category: { name: 'Filters' },
        },
        {
          id: '3',
          name: 'Vacuum Hose 2m',
          nameTh: 'สายดูดฝุ่น 2 เมตร',
          sku: 'VH-2M',
          barcode: '8850123456791',
          costPrice: 180,
          sellPrice: 320,
          stockQty: 8,
          minStock: 15,
          maxStock: 80,
          brand: { name: 'HoseMaster' },
          category: { name: 'Accessories' },
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        pages: 1,
      },
    };
  }

  @Get('inventory/categories')
  getCategories() {
    return [
      { id: '1', name: 'Motors', nameEn: 'Motors', nameTh: 'มอเตอร์' },
      { id: '2', name: 'Filters', nameEn: 'Filters', nameTh: 'ไส้กรอง' },
      { id: '3', name: 'Accessories', nameEn: 'Accessories', nameTh: 'อุปกรณ์เสริม' },
      { id: '4', name: 'Hoses', nameEn: 'Hoses', nameTh: 'สายดูด' },
    ];
  }

  @Get('inventory/brands')
  getBrands() {
    return [
      { id: '1', name: 'Premium Motors', description: 'High quality motors' },
      { id: '2', name: 'FilterPro', description: 'Professional filters' },
      { id: '3', name: 'HoseMaster', description: 'Durable hoses' },
      { id: '4', name: 'VacuumTech', description: 'Technology solutions' },
    ];
  }

  @Get('stock-in')
  getStockIns() {
    return {
      stockIns: [
        {
          id: '1',
          reference: 'SI-2024-001',
          supplier: 'ABC Supplies Co.',
          totalCost: 15000,
          status: 'RECEIVED',
          user: { name: 'Admin User' },
          _count: { items: 5 },
          items: [
            {
              id: '1',
              product: { name: 'Vacuum Motor V2000' },
              quantity: 10,
              unitCost: 1500,
            },
          ],
          notes: 'Monthly stock replenishment',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          reference: 'SI-2024-002',
          supplier: 'XYZ Parts Ltd.',
          totalCost: 8500,
          status: 'PENDING',
          user: { name: 'Staff User' },
          _count: { items: 3 },
          items: [],
          notes: 'Urgent order',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };
  }

  @Get('forecasting/insights/dashboard')
  getForecastingInsights() {
    return {
      averageAccuracy: 87,
      predictedStockouts: 3,
      abcAnalysis: {
        classA: 15,
        classB: 45,
        classC: 90,
      },
    };
  }

  @Get('forecasting/alerts/low-stock')
  getLowStockAlerts() {
    return [
      {
        id: '1',
        product: { name: 'Vacuum Hose 2m', minStock: 15 },
        currentStock: 8,
        severity: 'WARNING',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        product: { name: 'Vacuum Belt Standard', minStock: 20 },
        currentStock: 5,
        severity: 'CRITICAL',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // SALES / POS ENDPOINTS
  // ============================================

  @Post('sales/start')
  startSale(@Body() body: any) {
    const orderId = `order-${orderCounter++}`;
    const orderNumber = body.orderNumber || `SO-${Date.now()}`;
    
    const order = {
      id: orderId,
      orderNumber,
      staffId: 'staff-1',
      staff: { id: 'staff-1', name: 'Staff User', email: 'staff@example.com' },
      totalCost: 0,
      totalPrice: 0,
      profit: 0,
      status: 'DRAFT',
      items: [],
      paymentMethod: body.paymentMethod,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    salesOrders.set(orderId, order);
    return order;
  }

  @Post('sales/add-item')
  addItem(@Body() body: any) {
    const { orderId, sku, quantity = 1, unitPrice } = body;
    const order = salesOrders.get(orderId);

    if (!order) {
      return { error: 'Order not found', statusCode: 404 };
    }

    if (order.status !== 'DRAFT') {
      return { error: 'Cannot add items to confirmed order', statusCode: 400 };
    }

    // Find product (mock data)
    const products = [
      {
        id: '1',
        name: 'Vacuum Motor V2000',
        nameTh: 'มอเตอร์เครื่องดูดฝุ่น V2000',
        sku: 'VM-2000',
        barcode: '8850123456789',
        costPrice: 1500,
        sellPrice: 2200,
        stockQty: 45,
      },
      {
        id: '2',
        name: 'Vacuum Filter HEPA',
        nameTh: 'ไส้กรองเครื่องดูดฝุ่น HEPA',
        sku: 'VF-HEPA',
        barcode: '8850123456790',
        costPrice: 250,
        sellPrice: 450,
        stockQty: 120,
      },
      {
        id: '3',
        name: 'Vacuum Hose 2m',
        nameTh: 'สายดูดฝุ่น 2 เมตร',
        sku: 'VH-2M',
        barcode: '8850123456791',
        costPrice: 180,
        sellPrice: 320,
        stockQty: 8,
      },
    ];

    const product = products.find(p => p.sku === sku || p.barcode === sku);

    if (!product) {
      return { error: 'Product not found', statusCode: 404 };
    }

    if (product.stockQty < quantity) {
      return { error: 'Insufficient stock', statusCode: 400 };
    }

    // Check if item already exists
    const existingItem = order.items.find((item: any) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
      existingItem.profit = (existingItem.unitPrice - existingItem.unitCost) * existingItem.quantity;
    } else {
      const itemUnitPrice = unitPrice || product.sellPrice;
      const item = {
        id: `item-${Date.now()}`,
        orderId,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        barcode: product.barcode,
        quantity,
        unitCost: product.costPrice,
        unitPrice: itemUnitPrice,
        subtotal: itemUnitPrice * quantity,
        profit: (itemUnitPrice - product.costPrice) * quantity,
        product: {
          id: product.id,
          name: product.name,
          nameTh: product.nameTh,
          sku: product.sku,
          barcode: product.barcode,
          stockQty: product.stockQty,
        },
        createdAt: new Date().toISOString(),
      };
      order.items.push(item);
    }

    // Recalculate totals
    order.totalCost = order.items.reduce((sum: number, item: any) => sum + item.unitCost * item.quantity, 0);
    order.totalPrice = order.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    order.profit = order.totalPrice - order.totalCost;
    order.updatedAt = new Date().toISOString();

    return order;
  }

  @Post('sales/scan')
  scanBarcode(@Body() body: any) {
    const { orderId, barcodeValue } = body;
    
    // Try to add as product
    return this.addItem({ orderId, sku: barcodeValue, quantity: 1 });
  }

  @Patch('sales/item')
  updateItem(@Body() body: any) {
    const { itemId, quantity, unitPrice } = body;

    // Find order containing this item
    let targetOrder: any = null;
    let targetItem: any = null;

    for (const order of salesOrders.values()) {
      const item = order.items.find((i: any) => i.id === itemId);
      if (item) {
        targetOrder = order;
        targetItem = item;
        break;
      }
    }

    if (!targetItem) {
      return { error: 'Item not found', statusCode: 404 };
    }

    if (targetOrder.status !== 'DRAFT') {
      return { error: 'Cannot update confirmed order', statusCode: 400 };
    }

    if (quantity) targetItem.quantity = quantity;
    if (unitPrice) targetItem.unitPrice = unitPrice;

    targetItem.subtotal = targetItem.quantity * targetItem.unitPrice;
    targetItem.profit = (targetItem.unitPrice - targetItem.unitCost) * targetItem.quantity;

    // Recalculate order totals
    targetOrder.totalCost = targetOrder.items.reduce((sum: number, item: any) => sum + item.unitCost * item.quantity, 0);
    targetOrder.totalPrice = targetOrder.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    targetOrder.profit = targetOrder.totalPrice - targetOrder.totalCost;

    return targetOrder;
  }

  @Delete('sales/item/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    // Find and remove item
    for (const order of salesOrders.values()) {
      const itemIndex = order.items.findIndex((i: any) => i.id === itemId);
      if (itemIndex !== -1) {
        if (order.status !== 'DRAFT') {
          return { error: 'Cannot remove from confirmed order', statusCode: 400 };
        }

        order.items.splice(itemIndex, 1);

        // Recalculate totals
        order.totalCost = order.items.reduce((sum: number, item: any) => sum + item.unitCost * item.quantity, 0);
        order.totalPrice = order.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
        order.profit = order.totalPrice - order.totalCost;

        return order;
      }
    }

    return { error: 'Item not found', statusCode: 404 };
  }

  @Post('sales/confirm')
  confirmSale(@Body() body: any) {
    const { orderId, paymentMethod, customerName, customerPhone } = body;
    const order = salesOrders.get(orderId);

    if (!order) {
      return { error: 'Order not found', statusCode: 404 };
    }

    if (order.status !== 'DRAFT') {
      return { error: 'Order already confirmed', statusCode: 400 };
    }

    if (order.items.length === 0) {
      return { error: 'Cannot confirm empty order', statusCode: 400 };
    }

    order.status = 'CONFIRMED';
    order.confirmedAt = new Date().toISOString();
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (customerName) order.customerName = customerName;
    if (customerPhone) order.customerPhone = customerPhone;

    return order;
  }

  @Post('sales/:orderId/cancel')
  cancelOrder(@Param('orderId') orderId: string) {
    const order = salesOrders.get(orderId);

    if (!order) {
      return { error: 'Order not found', statusCode: 404 };
    }

    if (order.status === 'CONFIRMED') {
      return { error: 'Cannot cancel confirmed order', statusCode: 400 };
    }

    order.status = 'CANCELED';
    order.canceledAt = new Date().toISOString();

    return order;
  }

  @Get('sales/:orderId')
  getOrder(@Param('orderId') orderId: string) {
    const order = salesOrders.get(orderId);

    if (!order) {
      return { error: 'Order not found', statusCode: 404 };
    }

    return order;
  }

  @Get('sales')
  getSalesHistory() {
    const orders = Array.from(salesOrders.values()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      orders: orders.map((order: any) => ({
        ...order,
        _count: { items: order.items.length },
      })),
      pagination: {
        page: 1,
        limit: 20,
        total: orders.length,
        pages: 1,
      },
    };
  }

  @Get('sales/report/daily')
  getDailyReport() {
    const confirmedOrders = Array.from(salesOrders.values()).filter(
      (order: any) => order.status === 'CONFIRMED'
    );

    const totalOrders = confirmedOrders.length;
    const totalRevenue = confirmedOrders.reduce((sum: number, order: any) => sum + order.totalPrice, 0);
    const totalCost = confirmedOrders.reduce((sum: number, order: any) => sum + order.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalItemsSold = confirmedOrders.reduce(
      (sum: number, order: any) => sum + order.items.reduce((s: number, item: any) => s + item.quantity, 0),
      0
    );

    return {
      date: new Date().toISOString(),
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      totalItemsSold,
      orders: confirmedOrders,
    };
  }
}

@Module({
  controllers: [HealthController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('StockFlow API')
    .setDescription('Inventory Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Get underlying Express instance for custom routes
  const expressApp = app.getHttpAdapter().getInstance();

  // ============================================
  // ACCOUNTING ENDPOINTS
  // ============================================

  // Mock expense categories
  const mockExpenseCategories = [
    { id: '1', name: 'Rent', nameTh: 'ค่าเช่า', color: '#3B82F6', icon: '🏢', isActive: true },
    { id: '2', name: 'Utilities', nameTh: 'ค่าสาธารณูปโภค', color: '#10B981', icon: '⚡', isActive: true },
    { id: '3', name: 'Salaries', nameTh: 'เงินเดือน', color: '#8B5CF6', icon: '👥', isActive: true },
    { id: '4', name: 'Marketing', nameTh: 'การตลาด', color: '#F59E0B', icon: '📢', isActive: true },
    { id: '5', name: 'Office Supplies', nameTh: 'อุปกรณ์สำนักงาน', color: '#EF4444', icon: '📎', isActive: true },
    { id: '6', name: 'Transportation', nameTh: 'ค่าขนส่ง', color: '#06B6D4', icon: '🚚', isActive: true },
    { id: '7', name: 'Maintenance', nameTh: 'ค่าซ่อมบำรุง', color: '#84CC16', icon: '🔧', isActive: true },
    { id: '8', name: 'Other', nameTh: 'อื่นๆ', color: '#6B7280', icon: '📋', isActive: true },
  ];

  // Mock payment methods
  const mockPaymentMethods = [
    { id: '1', name: 'Cash', nameTh: 'เงินสด', isActive: true },
    { id: '2', name: 'Bank Transfer', nameTh: 'โอนเงิน', isActive: true },
    { id: '3', name: 'Credit Card', nameTh: 'บัตรเครดิต', isActive: true },
    { id: '4', name: 'Debit Card', nameTh: 'บัตรเดบิต', isActive: true },
    { id: '5', name: 'E-Wallet', nameTh: 'กระเป๋าเงินอิเล็กทรอนิกส์', isActive: true },
  ];

  // Mock expenses data
  const mockExpenses = [
    {
      id: '1',
      title: 'Office Rent - January',
      description: 'Monthly office rent payment',
      amount: 25000,
      expenseDate: '2025-01-15',
      category: mockExpenseCategories[0],
      paymentMethod: mockPaymentMethods[1],
      vendor: 'Property Management Co.',
      invoiceNumber: 'INV-2025-001',
      status: 'PAID',
      createdAt: '2025-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Electricity Bill',
      description: 'Monthly electricity payment',
      amount: 3500,
      expenseDate: '2025-01-20',
      category: mockExpenseCategories[1],
      paymentMethod: mockPaymentMethods[0],
      vendor: 'Electric Company',
      invoiceNumber: 'ELEC-2025-001',
      status: 'PAID',
      createdAt: '2025-01-20T14:30:00Z',
    },
    {
      id: '3',
      title: 'Facebook Ads Campaign',
      description: 'Q1 Marketing campaign',
      amount: 8000,
      expenseDate: '2025-01-25',
      category: mockExpenseCategories[3],
      paymentMethod: mockPaymentMethods[2],
      vendor: 'Meta Platforms',
      invoiceNumber: 'FB-2025-001',
      status: 'APPROVED',
      createdAt: '2025-01-25T09:15:00Z',
    },
  ];

  // Get expense categories
  expressApp.get('/accounting/categories', (req: any, res: any) => {
    res.json({ categories: mockExpenseCategories });
  });

  // Get payment methods
  expressApp.get('/accounting/payment-methods', (req: any, res: any) => {
    res.json({ paymentMethods: mockPaymentMethods });
  });

  // Get expenses with filters
  expressApp.get('/accounting/expenses', (req: any, res: any) => {
    const { status, categoryId, startDate, endDate, page = 1, limit = 20 } = req.query;
    let filtered = [...mockExpenses];

    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }
    if (categoryId) {
      filtered = filtered.filter(e => e.category.id === categoryId);
    }

    res.json({
      expenses: filtered,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filtered.length,
        pages: Math.ceil(filtered.length / Number(limit)),
      },
    });
  });

  // Get single expense
  expressApp.get('/accounting/expenses/:id', (req: any, res: any) => {
    const expense = mockExpenses.find(e => e.id === req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  });

  // Create expense
  expressApp.post('/accounting/expenses', (req: any, res: any) => {
    const newExpense = {
      id: String(mockExpenses.length + 1),
      ...req.body,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    mockExpenses.push(newExpense);
    res.status(201).json(newExpense);
  });

  // Update expense
  expressApp.patch('/accounting/expenses/:id', (req: any, res: any) => {
    const index = mockExpenses.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    mockExpenses[index] = { ...mockExpenses[index], ...req.body };
    res.json(mockExpenses[index]);
  });

  // Delete expense
  expressApp.delete('/accounting/expenses/:id', (req: any, res: any) => {
    const index = mockExpenses.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    mockExpenses.splice(index, 1);
    res.json({ message: 'Expense deleted successfully' });
  });

  // Get accounting dashboard overview
  expressApp.get('/accounting/overview', (req: any, res: any) => {
    const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = 125000; // Mock from sales
    const totalCost = 45000; // Mock COGS
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      overview: {
        totalRevenue,
        totalCost,
        totalExpenses,
        grossProfit,
        netProfit,
        profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2),
        expenseCount: mockExpenses.length,
        pendingExpenses: mockExpenses.filter(e => e.status === 'PENDING').length,
      },
      expensesByCategory: mockExpenseCategories.map(cat => ({
        category: cat,
        total: mockExpenses
          .filter(e => e.category.id === cat.id)
          .reduce((sum, e) => sum + e.amount, 0),
        count: mockExpenses.filter(e => e.category.id === cat.id).length,
      })),
      recentExpenses: mockExpenses.slice(0, 5),
    });
  });

  // Get financial report (P&L)
  expressApp.get('/accounting/reports/profit-loss', (req: any, res: any) => {
    const { year = 2025, month } = req.query;
    
    res.json({
      period: month ? `${year}-${String(month).padStart(2, '0')}` : year,
      revenue: {
        sales: 125000,
        other: 5000,
        total: 130000,
      },
      costs: {
        cogs: 45000,
        total: 45000,
      },
      grossProfit: 85000,
      expenses: {
        rent: 25000,
        utilities: 3500,
        salaries: 30000,
        marketing: 8000,
        other: 5000,
        total: 71500,
      },
      netProfit: 13500,
      profitMargin: 10.38,
    });
  });

  // Get cash flow report
  expressApp.get('/accounting/reports/cash-flow', (req: any, res: any) => {
    res.json({
      period: '2025-01',
      openingBalance: 100000,
      cashIn: {
        sales: 125000,
        other: 5000,
        total: 130000,
      },
      cashOut: {
        expenses: 71500,
        purchases: 45000,
        total: 116500,
      },
      netCashFlow: 13500,
      closingBalance: 113500,
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 Backend API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${port}/health\n`);
}

bootstrap();

