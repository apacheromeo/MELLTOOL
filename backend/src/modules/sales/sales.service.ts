import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateSalesOrderDto,
  AddItemDto,
  ScanBarcodeDto,
  ConfirmSaleDto,
  UpdateItemDto,
  UpdateOrderDto,
  CancelOrderDto,
  ReturnOrderDto,
} from './dto';
import { SearchPosProductsDto } from './dto/search-pos-products.dto';
import { ApplyDiscountDto, DiscountType } from './dto/apply-discount.dto';
import { QuickStartDto } from './dto/quick-start.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';

/**
 * Sales Service
 * Handles all POS (Point of Sale) operations including:
 * - Creating draft sales orders
 * - Adding/removing items via barcode scanning
 * - Confirming sales and cutting stock
 * - Generating sales reports
 */
@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a new sales order (draft)
   * Creates an empty order that staff can add items to
   * If a cancelled order exists with the same order number, reuse it
   */
  async startSale(staffId: string, dto: CreateSalesOrderDto) {
    this.logger.log(`Starting new sale for staff: ${staffId}`);

    // Generate order number if not provided
    const orderNumber =
      dto.orderNumber || this.generateOrderNumber();

    // Check if an order with this number already exists
    if (dto.orderNumber) {
      const existingOrder = await this.prisma.salesOrder.findUnique({
        where: { orderNumber: dto.orderNumber },
      });

      // If a CANCELED order exists with this number, reuse it by resetting to DRAFT
      if (existingOrder && existingOrder.status === 'CANCELED') {
        this.logger.log(
          `Reusing canceled order ${existingOrder.id} with number ${orderNumber}`,
        );

        // Delete existing items and reset the order to DRAFT
        await this.prisma.salesItem.deleteMany({
          where: { orderId: existingOrder.id },
        });

        const order = await this.prisma.salesOrder.update({
          where: { id: existingOrder.id },
          data: {
            staffId,
            paymentMethod: dto.paymentMethod,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            notes: dto.notes,
            channel: dto.channel || 'POS',
            status: 'DRAFT',
            totalCost: 0,
            totalPrice: 0,
            profit: 0,
          },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        this.logger.log(`Reused sales order: ${order.id}`);
        return order;
      }

      // If a non-cancelled order exists, throw an error
      if (existingOrder) {
        throw new BadRequestException(
          `Order number ${orderNumber} already exists with status ${existingOrder.status}`,
        );
      }
    }

    // Create new order
    const order = await this.prisma.salesOrder.create({
      data: {
        orderNumber,
        staffId,
        paymentMethod: dto.paymentMethod,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        channel: dto.channel || 'POS',
        status: 'DRAFT',
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Created sales order: ${order.id}`);
    return order;
  }

  /**
   * Add an item to the sales order by SKU or barcode
   * If item already exists, increment quantity
   */
  async addItem(dto: AddItemDto) {
    this.logger.log(`Adding item to order: ${dto.orderId}`);

    // Verify order exists and is in DRAFT status
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException(
        'Cannot add items to a confirmed or canceled order',
      );
    }

    // Find product by SKU or barcode
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { sku: dto.sku },
          { barcode: dto.sku },
        ],
      },
      include: {
        masterProduct: {
          select: {
            id: true,
            stockQty: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product not found with SKU/barcode: ${dto.sku}`,
      );
    }

    // For variants, use master product's stock; otherwise use product's own stock
    const actualStock = product.masterProductId && product.masterProduct
      ? product.masterProduct.stockQty
      : product.stockQty;

    // Check if sufficient stock is available
    if (actualStock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${actualStock}, Requested: ${dto.quantity}`,
      );
    }

    // Check if item already exists in order
    const existingItem = order.items.find(
      (item) => item.productId === product.id,
    );

    let salesItem;

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + dto.quantity;

      // Check stock again for new total
      if (actualStock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock for total quantity. Available: ${actualStock}, Requested: ${newQuantity}`,
        );
      }

      const unitPrice = dto.unitPrice || product.sellPrice || product.costPrice;
      const subtotal = unitPrice * newQuantity;
      const profit = (unitPrice - product.costPrice) * newQuantity;

      salesItem = await this.prisma.salesItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice,
          subtotal,
          profit,
        },
        include: {
          product: true,
        },
      });

      this.logger.log(
        `Updated item quantity: ${existingItem.id} -> ${newQuantity}`,
      );
    } else {
      // Create new item
      const unitPrice = dto.unitPrice || product.sellPrice || product.costPrice;
      const subtotal = unitPrice * dto.quantity;
      const profit = (unitPrice - product.costPrice) * dto.quantity;

      salesItem = await this.prisma.salesItem.create({
        data: {
          orderId: dto.orderId,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          barcode: product.barcode,
          quantity: dto.quantity,
          unitCost: product.costPrice,
          unitPrice,
          subtotal,
          profit,
        },
        include: {
          product: true,
        },
      });

      this.logger.log(`Created new sales item: ${salesItem.id}`);
    }

    // Recalculate order totals
    await this.recalculateOrderTotals(dto.orderId);

    // Return updated order
    return this.getOrderById(dto.orderId);
  }

  /**
   * Scan a barcode - automatically detect if it's a product or order number
   */
  async scanBarcode(dto: ScanBarcodeDto) {
    this.logger.log(`Scanning barcode: ${dto.barcodeValue}`);

    // First, try to find a product
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { sku: dto.barcodeValue },
          { barcode: dto.barcodeValue },
        ],
      },
    });

    if (product) {
      // It's a product barcode - add to cart
      return this.addItem({
        orderId: dto.orderId,
        sku: dto.barcodeValue,
        quantity: 1,
      });
    }

    // Product not found - check if user wants to update order number
    // or if it's truly an unknown barcode
    this.logger.warn(`Barcode not found as product: ${dto.barcodeValue}`);

    // Check if it's an order number barcode
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    // If the scanned value looks like it could be an order number (has expected format)
    // then update it, otherwise throw a "product not found" error
    const isLikelyOrderNumber = /^[A-Z]{2}-\d{8}-\d{4}$/.test(dto.barcodeValue);

    if (!isLikelyOrderNumber) {
      throw new NotFoundException(
        `Product not found with barcode/SKU: ${dto.barcodeValue}. Please check the barcode and try again.`
      );
    }

    // Update order number if it matches expected format
    const updatedOrder = await this.prisma.salesOrder.update({
      where: { id: dto.orderId },
      data: { orderNumber: dto.barcodeValue },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Updated order number: ${dto.barcodeValue}`);
    return {
      ...updatedOrder,
      message: 'Order number updated',
      type: 'order_number',
    };
  }

  /**
   * Update an existing sales item (quantity or price)
   */
  async updateItem(dto: UpdateItemDto) {
    this.logger.log(`Updating sales item: ${dto.itemId}`);

    const item = await this.prisma.salesItem.findUnique({
      where: { id: dto.itemId },
      include: {
        order: true,
        product: {
          include: {
            masterProduct: {
              select: {
                id: true,
                stockQty: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Sales item not found');
    }

    if (item.order.status !== 'DRAFT') {
      throw new BadRequestException(
        'Cannot update items in a confirmed or canceled order',
      );
    }

    // For variants, use master product's stock; otherwise use product's own stock
    const actualStock = item.product.masterProductId && item.product.masterProduct
      ? item.product.masterProduct.stockQty
      : item.product.stockQty;

    // Check stock if quantity is being updated
    if (dto.quantity && dto.quantity !== item.quantity) {
      if (actualStock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${actualStock}`,
        );
      }
    }

    const quantity = dto.quantity || item.quantity;
    const unitPrice = dto.unitPrice || item.unitPrice;
    const subtotal = unitPrice * quantity;
    const profit = (unitPrice - item.unitCost) * quantity;

    const updatedItem = await this.prisma.salesItem.update({
      where: { id: dto.itemId },
      data: {
        quantity,
        unitPrice,
        subtotal,
        profit,
      },
      include: {
        product: true,
      },
    });

    // Recalculate order totals
    await this.recalculateOrderTotals(item.orderId);

    this.logger.log(`Updated sales item: ${dto.itemId}`);
    return this.getOrderById(item.orderId);
  }

  /**
   * Remove an item from the sales order
   */
  async removeItem(itemId: string) {
    this.logger.log(`Removing sales item: ${itemId}`);

    const item = await this.prisma.salesItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item) {
      throw new NotFoundException('Sales item not found');
    }

    if (item.order.status !== 'DRAFT') {
      throw new BadRequestException(
        'Cannot remove items from a confirmed or canceled order',
      );
    }

    await this.prisma.salesItem.delete({
      where: { id: itemId },
    });

    // Recalculate order totals
    await this.recalculateOrderTotals(item.orderId);

    this.logger.log(`Removed sales item: ${itemId}`);
    return this.getOrderById(item.orderId);
  }

  /**
   * Confirm the sale - cut stock and finalize the transaction
   * This is the critical operation that updates inventory
   */
  async confirmSale(dto: ConfirmSaleDto) {
    this.logger.log(`Confirming sale: ${dto.orderId}`);

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                masterProduct: {
                  select: {
                    id: true,
                    stockQty: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Order is already confirmed or canceled');
    }

    if (order.items.length === 0) {
      throw new BadRequestException('Cannot confirm an empty order');
    }

    // Verify stock availability for all items
    for (const item of order.items) {
      // For variants, use master product's stock; otherwise use product's own stock
      const actualStock = item.product.masterProductId && item.product.masterProduct
        ? item.product.masterProduct.stockQty
        : item.product.stockQty;

      if (actualStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.productName}. Available: ${actualStock}, Required: ${item.quantity}`,
        );
      }
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Cut stock for each item
      for (const item of order.items) {
        // For variants, decrement master product's stock; otherwise decrement product's own stock
        const productIdToUpdate = item.product.masterProductId || item.productId;

        await tx.product.update({
          where: { id: productIdToUpdate },
          data: {
            stockQty: {
              decrement: item.quantity,
            },
          },
        });

        this.logger.log(
          `Cut stock for ${item.productName}: -${item.quantity} units${
            item.product.masterProductId ? ' (from master product)' : ''
          }`,
        );
      }

      // Update order status
      const confirmedOrder = await tx.salesOrder.update({
        where: { id: dto.orderId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          paymentMethod: dto.paymentMethod || order.paymentMethod,
          customerName: dto.customerName || order.customerName,
          customerPhone: dto.customerPhone || order.customerPhone,
        },
        include: {
          staff: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update daily sales summary
      await this.updateDailySummary(confirmedOrder);

      return confirmedOrder;
    });

    this.logger.log(`Sale confirmed: ${dto.orderId}`);
    return result;
  }

  /**
   * Cancel a draft order
   */
  async cancelOrder(orderId: string) {
    this.logger.log(`Canceling order: ${orderId}`);

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status === 'CONFIRMED') {
      throw new BadRequestException(
        'Cannot cancel a confirmed order. Use refund instead.',
      );
    }

    const canceledOrder = await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Order canceled: ${orderId}`);
    return canceledOrder;
  }

  /**
   * Get order by ID with all details
   */
  async getOrderById(orderId: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameTh: true,
                sku: true,
                barcode: true,
                stockQty: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    return order;
  }

  /**
   * Get order by order number (for QR code matching)
   */
  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { orderNumber },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameTh: true,
                sku: true,
                barcode: true,
                stockQty: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Sales order not found with order number: ${orderNumber}`,
      );
    }

    return order;
  }

  /**
   * Get sales history with filters
   */
  async getSalesHistory(params: {
    page?: number;
    limit?: number;
    status?: string;
    channel?: string;
    staffId?: string;
    orderNumber?: string;
    productSearch?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (params.status) {
        where.status = params.status;
      }

      if (params.channel) {
        where.channel = params.channel;
      }

      if (params.staffId) {
        where.staffId = params.staffId;
      }

      if (params.orderNumber) {
        where.orderNumber = {
          contains: params.orderNumber,
          mode: 'insensitive',
        };
      }

      if (params.productSearch) {
        where.items = {
          some: {
            OR: [
              { sku: { contains: params.productSearch, mode: 'insensitive' } },
              { productName: { contains: params.productSearch, mode: 'insensitive' } },
            ],
          },
        };
      }

      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) {
          where.createdAt.gte = params.startDate;
        }
        if (params.endDate) {
          where.createdAt.lte = params.endDate;
        }
      }

      const [orders, total] = await Promise.all([
        this.prisma.salesOrder.findMany({
          where,
          include: {
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              select: {
                id: true,
                sku: true,
                productName: true,
                quantity: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.salesOrder.count({ where }),
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching sales history: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch sales history: ${error.message}`);
    }
  }

  /**
   * Get daily sales report
   */
  async getDailyReport(date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const orders = await this.prisma.salesOrder.findMany({
        where: {
          status: 'CONFIRMED',
          confirmedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          items: true,
          staff: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalCost = orders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
      const totalProfit = totalRevenue - totalCost;
      const totalItemsSold = orders.reduce(
        (sum, order) => sum + (order.items || []).reduce((s, item) => s + (item.quantity || 0), 0),
        0,
      );

      return {
        date,
        totalOrders,
        totalRevenue,
        totalCost,
        totalProfit,
        totalItemsSold,
        orders,
      };
    } catch (error) {
      this.logger.error(`Error fetching daily report: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch daily report: ${error.message}`);
    }
  }

  /**
   * Get weekly sales report
   */
  async getWeeklyReport(date: Date) {
    // Get start of week (Monday)
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const orders = await this.prisma.salesOrder.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalCost = orders.reduce((sum, order) => sum + order.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalItemsSold = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0,
    );

    // Group by day
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter(
        (order) =>
          order.confirmedAt >= dayStart && order.confirmedAt <= dayEnd,
      );

      dailyBreakdown.push({
        date: day,
        dayName: day.toLocaleDateString('en-US', { weekday: 'long' }),
        totalOrders: dayOrders.length,
        totalRevenue: dayOrders.reduce((sum, order) => sum + order.totalPrice, 0),
        totalCost: dayOrders.reduce((sum, order) => sum + order.totalCost, 0),
        totalProfit: dayOrders.reduce((sum, order) => sum + order.profit, 0),
      });
    }

    return {
      startOfWeek,
      endOfWeek,
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      totalItemsSold,
      dailyBreakdown,
      orders,
    };
  }

  /**
   * Get monthly sales report
   */
  async getMonthlyReport(year: number, month: number) {
    // Validate month
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    // Get start and end of month
    const startOfMonth = new Date(year, month - 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(year, month, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const orders = await this.prisma.salesOrder.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalCost = orders.reduce((sum, order) => sum + order.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalItemsSold = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0,
    );

    // Calculate top selling products
    const productSales = new Map<string, {
      productId: string;
      productName: string;
      sku: string;
      totalQuantity: number;
      totalRevenue: number;
    }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId;
        const existing = productSales.get(key);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.subtotal;
        } else {
          productSales.set(key, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            totalQuantity: item.quantity,
            totalRevenue: item.subtotal,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Sales by staff
    const staffSales = new Map<string, {
      staffId: string;
      staffName: string;
      totalOrders: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    orders.forEach((order) => {
      const key = order.staffId;
      const existing = staffSales.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalRevenue += order.totalPrice;
        existing.totalProfit += order.profit;
      } else {
        staffSales.set(key, {
          staffId: order.staffId,
          staffName: order.staff.name,
          totalOrders: 1,
          totalRevenue: order.totalPrice,
          totalProfit: order.profit,
        });
      }
    });

    const staffPerformance = Array.from(staffSales.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
      startOfMonth,
      endOfMonth,
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      totalItemsSold,
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      topProducts,
      staffPerformance,
      orders,
    };
  }

  /**
   * POS-specific: Search products for quick add
   * Optimized for speed and relevance
   */
  async searchPosProducts(dto: SearchPosProductsDto) {
    const {
      query,
      categoryId,
      brandId,
      page = 1,
      limit = 20,
      inStockOnly = true,
      minStock,
    } = dto;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    // Search by name, SKU, or barcode
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { nameTh: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter by brand
    if (brandId) {
      where.brandId = brandId;
    }

    // Only show products with stock
    if (inStockOnly) {
      where.stockQty = { gt: 0 };
    }

    if (minStock !== undefined) {
      where.stockQty = { gte: minStock };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          nameTh: true,
          barcode: true,
          sellPrice: true,
          costPrice: true,
          stockQty: true,
          imageUrl: true,
          category: {
            select: {
              id: true,
              name: true,
              nameTh: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              nameTh: true,
            },
          },
        },
        orderBy: [
          { stockQty: 'desc' }, // Prioritize items with more stock
          { name: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trending products (most sold in last 30 days)
   */
  async getTrendingProducts(limit: number = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesItems = await this.prisma.salesItem.findMany({
      where: {
        order: {
          status: 'CONFIRMED',
          confirmedAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            nameTh: true,
            barcode: true,
            sellPrice: true,
            stockQty: true,
            imageUrl: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by product
    const productSalesMap = new Map<string, {
      product: any;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
    }>();

    salesItems.forEach((item) => {
      const existing = productSalesMap.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.subtotal;
        existing.orderCount += 1;
      } else {
        productSalesMap.set(item.productId, {
          product: item.product,
          totalQuantity: item.quantity,
          totalRevenue: item.subtotal,
          orderCount: 1,
        });
      }
    });

    // Sort by quantity sold and take top N
    const trending = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)
      .map((item) => ({
        ...item.product,
        trending: {
          soldLast30Days: item.totalQuantity,
          revenueLast30Days: item.totalRevenue,
          ordersCount: item.orderCount,
        },
      }));

    return trending;
  }

  /**
   * Get recently sold products (useful for quick repeat orders)
   */
  async getRecentProducts(staffId?: string, limit: number = 10) {
    const where: any = {
      status: 'CONFIRMED',
    };

    if (staffId) {
      where.staffId = staffId;
    }

    const recentOrders = await this.prisma.salesOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                nameTh: true,
                barcode: true,
                sellPrice: true,
                stockQty: true,
                imageUrl: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        confirmedAt: 'desc',
      },
      take: 20, // Get recent orders
    });

    // Extract unique products
    const seenProducts = new Set<string>();
    const recentProducts = [];

    for (const order of recentOrders) {
      for (const item of order.items) {
        if (!seenProducts.has(item.productId) && item.product.stockQty > 0) {
          seenProducts.add(item.productId);
          recentProducts.push({
            ...item.product,
            lastSold: order.confirmedAt,
          });

          if (recentProducts.length >= limit) {
            break;
          }
        }
      }
      if (recentProducts.length >= limit) {
        break;
      }
    }

    return recentProducts;
  }

  /**
   * Get products by category (for category-based navigation)
   */
  async getProductsByCategory(categoryId: string, limit: number = 20) {
    const products = await this.prisma.product.findMany({
      where: {
        categoryId,
        isActive: true,
        stockQty: {
          gt: 0,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        nameTh: true,
        barcode: true,
        sellPrice: true,
        stockQty: true,
        imageUrl: true,
        category: {
          select: {
            id: true,
            name: true,
            nameTh: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            nameTh: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return products;
  }

  /**
   * Apply discount to order
   */
  async applyDiscount(dto: ApplyDiscountDto) {
    const { orderId, discountType, discountValue, reason } = dto;

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Cannot apply discount to confirmed or canceled order');
    }

    let discountAmount = 0;

    if (discountType === DiscountType.PERCENTAGE) {
      if (discountValue < 0 || discountValue > 100) {
        throw new BadRequestException('Percentage discount must be between 0 and 100');
      }
      discountAmount = (order.totalPrice * discountValue) / 100;
    } else {
      // Fixed amount
      if (discountValue < 0) {
        throw new BadRequestException('Discount amount cannot be negative');
      }
      if (discountValue > order.totalPrice) {
        throw new BadRequestException('Discount amount cannot exceed order total');
      }
      discountAmount = discountValue;
    }

    const newTotalPrice = order.totalPrice - discountAmount;
    const newProfit = newTotalPrice - order.totalCost;

    // Store discount info in notes
    const discountNote = reason
      ? `Discount applied: ${discountType === DiscountType.PERCENTAGE ? `${discountValue}%` : `฿${discountValue}`} - ${reason}`
      : `Discount applied: ${discountType === DiscountType.PERCENTAGE ? `${discountValue}%` : `฿${discountValue}`}`;

    const updatedOrder = await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        totalPrice: newTotalPrice,
        profit: newProfit,
        notes: order.notes ? `${order.notes}\n${discountNote}` : discountNote,
      },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Discount applied to order ${orderId}: ${discountType} ${discountValue}`);

    return {
      ...updatedOrder,
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount,
      },
    };
  }

  /**
   * 🚀 QUICK START - Everything staff needs in ONE call
   * Returns trending, recent, categories, and search results
   * Perfect for POS homepage - load once, search instantly!
   */
  async quickStart(staffId: string, dto: QuickStartDto) {
    const { query, trendingLimit = 6, recentLimit = 6 } = dto;

    // Run all queries in parallel for speed
    const [trending, recent, categories, brands, searchResults] = await Promise.all([
      // Trending products
      this.getTrendingProducts(trendingLimit),

      // Recent products for this staff
      this.getRecentProducts(staffId, recentLimit),

      // All categories with product counts
      this.prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          nameTh: true,
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                  stockQty: { gt: 0 },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),

      // All brands with product counts
      this.prisma.brand.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          nameTh: true,
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                  stockQty: { gt: 0 },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),

      // If query provided, search products
      query
        ? this.searchPosProducts({
            query,
            page: 1,
            limit: 20,
            inStockOnly: true,
          })
        : null,
    ]);

    return {
      trending,
      recent,
      categories: categories.map((cat) => ({
        ...cat,
        productCount: cat._count.products,
      })),
      brands: brands.map((brand) => ({
        ...brand,
        productCount: brand._count.products,
      })),
      searchResults: searchResults || null,
    };
  }

  /**
   * ⚡ AUTOCOMPLETE - Super fast search as user types
   * Returns top 10 matches instantly (minimum 2 characters)
   */
  async autocomplete(dto: AutocompleteDto) {
    const { query } = dto;

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { gt: 0 },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameTh: { contains: query, mode: 'insensitive' } },
          { sku: { startsWith: query.toUpperCase() } },
          { barcode: { startsWith: query } },
        ],
      },
      select: {
        id: true,
        sku: true,
        name: true,
        nameTh: true,
        barcode: true,
        sellPrice: true,
        stockQty: true,
        imageUrl: true,
        category: {
          select: {
            name: true,
            nameTh: true,
          },
        },
        brand: {
          select: {
            name: true,
            nameTh: true,
          },
        },
      },
      orderBy: [
        { stockQty: 'desc' },
        { name: 'asc' },
      ],
      take: 10, // Only top 10 for speed
    });

    return products;
  }

  /**
   * Private helper: Generate a unique order number
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `SO-${year}${month}${day}-${random}`;
  }

  /**
   * Private helper: Recalculate order totals
   */
  private async recalculateOrderTotals(orderId: string) {
    const items = await this.prisma.salesItem.findMany({
      where: { orderId },
    });

    const totalCost = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);
    const profit = totalPrice - totalCost;

    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        totalCost,
        totalPrice,
        profit,
      },
    });
  }

  /**
   * Private helper: Update daily sales summary
   */
  private async updateDailySummary(order: any) {
    const date = new Date(order.confirmedAt);
    date.setHours(0, 0, 0, 0);

    const totalItemsSold = order.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );

    await this.prisma.dailySalesSummary.upsert({
      where: { date },
      create: {
        date,
        totalOrders: 1,
        totalRevenue: order.totalPrice,
        totalCost: order.totalCost,
        totalProfit: order.profit,
        totalItemsSold,
      },
      update: {
        totalOrders: { increment: 1 },
        totalRevenue: { increment: order.totalPrice },
        totalCost: { increment: order.totalCost },
        totalProfit: { increment: order.profit },
        totalItemsSold: { increment: totalItemsSold },
      },
    });
  }

  /**
   * Update order metadata (customer info, payment method, notes)
   * Only allows updating non-critical fields
   */
  async updateOrder(orderId: string, dto: UpdateOrderDto) {
    this.logger.log(`Updating order metadata: ${orderId}`);

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    const updatedOrder = await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Order metadata updated: ${orderId}`);
    return updatedOrder;
  }

  /**
   * Cancel order with reason (supports both DRAFT and CONFIRMED orders)
   * For CONFIRMED orders, restores stock to inventory
   */
  async cancelOrderWithReason(dto: CancelOrderDto, userRole?: string) {
    this.logger.log(`Canceling order with reason: ${dto.orderId}`);

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    // Check if order is already canceled or returned
    if (order.status === 'CANCELED' || order.status === 'RETURNED') {
      throw new BadRequestException('Order is already canceled or returned');
    }

    // Role-based authorization check
    // STAFF needs approval (requiresApproval should be true and handled by frontend/approval system)
    // OWNER and MOD can cancel directly
    if (userRole === 'STAFF' && dto.requiresApproval) {
      // This is now handled by the createCancellationRequest method
      // Staff should use that endpoint instead
      throw new BadRequestException(
        'Staff cancellation requires admin approval. Use the cancellation request endpoint.',
      );
    }

    // If order is CONFIRMED, we need to restore stock
    if (order.status === 'CONFIRMED') {
      this.logger.log(`Restoring stock for confirmed order: ${dto.orderId}`);

      // Restore stock for each item
      for (const item of order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              increment: item.quantity,
            },
          },
        });

        this.logger.log(
          `Restored ${item.quantity} units to product: ${item.product.sku}`,
        );
      }
    }

    // Update order status to CANCELED
    const canceledOrder = await this.prisma.salesOrder.update({
      where: { id: dto.orderId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        cancellationReason: dto.reason,
      },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Order canceled: ${dto.orderId}`);
    return canceledOrder;
  }

  /**
   * Mark order as returned to warehouse
   * Restores stock and tracks shipping cost for expense management
   */
  async returnOrder(dto: ReturnOrderDto) {
    this.logger.log(`Processing order return: ${dto.orderId}`);

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    // Only CONFIRMED orders can be returned
    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only confirmed orders can be marked as returned',
      );
    }

    // Restore stock for each item
    this.logger.log(`Restoring stock for returned order: ${dto.orderId}`);
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQty: {
            increment: item.quantity,
          },
        },
      });

      this.logger.log(
        `Restored ${item.quantity} units to product: ${item.product.sku}`,
      );
    }

    // Update order status to RETURNED
    const returnedOrder = await this.prisma.salesOrder.update({
      where: { id: dto.orderId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        shippingCost: dto.shippingCost || 0,
        cancellationReason: dto.reason,
      },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(
      `Order marked as returned: ${dto.orderId}, shipping cost: ${dto.shippingCost || 0}`,
    );
    return returnedOrder;
  }

  /**
   * Create a cancellation request for STAFF users
   * This request will need to be approved by OWNER or MOD
   */
  async createCancellationRequest(
    orderId: string,
    reason: string,
    userId: string,
  ) {
    this.logger.log(
      `Creating cancellation request for order: ${orderId} by user: ${userId}`,
    );

    // Check if order exists
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        cancellationRequests: {
          where: {
            approvalStatus: 'PENDING_APPROVAL',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    // Check if order is already canceled or returned
    if (order.status === 'CANCELED' || order.status === 'RETURNED') {
      throw new BadRequestException('Order is already canceled or returned');
    }

    // Check if there's already a pending request for this order
    if (order.cancellationRequests.length > 0) {
      throw new BadRequestException(
        'A cancellation request is already pending for this order',
      );
    }

    // Create the cancellation request
    const request = await this.prisma.cancellationRequest.create({
      data: {
        orderId,
        reason,
        requestedById: userId,
        approvalStatus: 'PENDING_APPROVAL',
      },
      include: {
        order: {
          include: {
            staff: true,
            items: true,
          },
        },
        requestedBy: true,
      },
    });

    this.logger.log(`Cancellation request created: ${request.id}`);
    return request;
  }

  /**
   * Get all pending cancellation requests (for OWNER/MOD)
   */
  async getPendingCancellationRequests() {
    this.logger.log('Fetching pending cancellation requests');

    return this.prisma.cancellationRequest.findMany({
      where: {
        approvalStatus: 'PENDING_APPROVAL',
      },
      include: {
        order: {
          include: {
            staff: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        requestedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all cancellation requests (with optional filtering)
   */
  async getCancellationRequests(status?: string) {
    this.logger.log(`Fetching cancellation requests with status: ${status}`);

    const where: any = {};
    if (status) {
      where.approvalStatus = status;
    }

    return this.prisma.cancellationRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalPrice: true,
            createdAt: true,
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              select: {
                id: true,
                productName: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Approve a cancellation request (OWNER/MOD only)
   * This will actually cancel the order
   */
  async approveCancellationRequest(requestId: string, approverId: string) {
    this.logger.log(
      `Approving cancellation request: ${requestId} by user: ${approverId}`,
    );

    const request = await this.prisma.cancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Cancellation request not found');
    }

    if (request.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Cancellation request has already been processed',
      );
    }

    // Check if order is still valid for cancellation
    if (
      request.order.status === 'CANCELED' ||
      request.order.status === 'RETURNED'
    ) {
      throw new BadRequestException('Order is already canceled or returned');
    }

    // If order is CONFIRMED, restore stock
    if (request.order.status === 'CONFIRMED') {
      this.logger.log(
        `Restoring stock for confirmed order: ${request.order.id}`,
      );

      for (const item of request.order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              increment: item.quantity,
            },
          },
        });

        this.logger.log(
          `Restored ${item.quantity} units to product: ${item.product.sku}`,
        );
      }
    }

    // Update the cancellation request
    await this.prisma.cancellationRequest.update({
      where: { id: requestId },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    // Cancel the order
    const canceledOrder = await this.prisma.salesOrder.update({
      where: { id: request.orderId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        cancellationReason: request.reason,
      },
      include: {
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Cancellation request approved and order canceled`);
    return canceledOrder;
  }

  /**
   * Reject a cancellation request (OWNER/MOD only)
   */
  async rejectCancellationRequest(
    requestId: string,
    approverId: string,
    rejectionReason: string,
  ) {
    this.logger.log(
      `Rejecting cancellation request: ${requestId} by user: ${approverId}`,
    );

    const request = await this.prisma.cancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        order: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Cancellation request not found');
    }

    if (request.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Cancellation request has already been processed',
      );
    }

    // Update the cancellation request
    const rejectedRequest = await this.prisma.cancellationRequest.update({
      where: { id: requestId },
      data: {
        approvalStatus: 'REJECTED',
        approvedById: approverId,
        approvedAt: new Date(),
        rejectionReason,
      },
      include: {
        order: {
          include: {
            staff: true,
            items: true,
          },
        },
        requestedBy: true,
        approvedBy: true,
      },
    });

    this.logger.log(`Cancellation request rejected`);
    return rejectedRequest;
  }
}



