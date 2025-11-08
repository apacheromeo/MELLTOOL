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
} from './dto';

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
   */
  async startSale(staffId: string, dto: CreateSalesOrderDto) {
    this.logger.log(`Starting new sale for staff: ${staffId}`);

    // Generate order number if not provided
    const orderNumber =
      dto.orderNumber || this.generateOrderNumber();

    const order = await this.prisma.salesOrder.create({
      data: {
        orderNumber,
        staffId,
        paymentMethod: dto.paymentMethod,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
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
    });

    if (!product) {
      throw new NotFoundException(
        `Product not found with SKU/barcode: ${dto.sku}`,
      );
    }

    // Check if sufficient stock is available
    if (product.stockQty < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stockQty}, Requested: ${dto.quantity}`,
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
      if (product.stockQty < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock for total quantity. Available: ${product.stockQty}, Requested: ${newQuantity}`,
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
        product: true,
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

    // Check stock if quantity is being updated
    if (dto.quantity && dto.quantity !== item.quantity) {
      if (item.product.stockQty < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${item.product.stockQty}`,
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
            product: true,
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
      if (item.product.stockQty < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.productName}. Available: ${item.product.stockQty}, Required: ${item.quantity}`,
        );
      }
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Cut stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              decrement: item.quantity,
            },
          },
        });

        this.logger.log(
          `Cut stock for ${item.productName}: -${item.quantity} units`,
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
    staffId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.staffId) {
      where.staffId = params.staffId;
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
  }

  /**
   * Get daily sales report
   */
  async getDailyReport(date: Date) {
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
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalCost = orders.reduce((sum, order) => sum + order.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalItemsSold = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
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
}



