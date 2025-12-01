import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ProductService } from '../inventory/product.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { UpdateStockInDto } from './dto/update-stock-in.dto';

@Injectable()
export class StockInService {
  private readonly logger = new Logger(StockInService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async create(createStockInDto: CreateStockInDto, userId: string) {
    const { reference, supplier, notes, items } = createStockInDto;

    try {
      // Get user role to determine if auto-approval is needed
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Calculate totals
      const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
      const totalCost = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

      // OWNER users auto-approve their own stock-ins
      const isOwner = user.role === 'OWNER';
      const approvalStatus = isOwner ? 'APPROVED' : 'PENDING_APPROVAL';
      const approvedBy = isOwner ? userId : null;
      const approvedAt = isOwner ? new Date() : null;

      // Create stock-in with items
      const stockIn = await this.prisma.stockIn.create({
        data: {
          reference,
          supplier,
          notes,
          totalQty,
          totalCost,
          userId,
          approvalStatus,
          approvedBy,
          approvedAt,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              qty: item.qty,
              unitCost: item.unitCost,
              totalCost: item.qty * item.unitCost,
            })),
          },
        },
        include: {
          user: { select: { name: true, email: true, role: true } },
          approver: { select: { name: true, email: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  nameTh: true,
                  brand: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `Stock-in created: ${stockIn.reference} with ${items.length} items by ${user.role} user. ` +
        `Approval status: ${approvalStatus}`
      );

      return stockIn;
    } catch (error) {
      this.logger.error(`Error creating stock-in: ${error.message}`, error);
      throw new BadRequestException('Failed to create stock-in order');
    }
  }

  async findAll(page: number = 1, limit: number = 20, status?: string, approvalStatus?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    const [stockIns, total] = await Promise.all([
      this.prisma.stockIn.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } },
          approver: { select: { name: true, email: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  brand: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockIn.count({ where }),
    ]);

    return {
      stockIns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingApprovals() {
    const pendingStockIns = await this.prisma.stockIn.findMany({
      where: {
        approvalStatus: 'PENDING_APPROVAL',
        status: { not: 'CANCELLED' },
      },
      include: {
        user: { select: { name: true, email: true, role: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                brand: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      pendingApprovals: pendingStockIns,
      count: pendingStockIns.length,
    };
  }

  async findOne(id: string) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, role: true } },
        approver: { select: { name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                nameTh: true,
                stockQty: true,
                costPrice: true,
                brand: { select: { name: true } },
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    return stockIn;
  }

  async update(id: string, updateStockInDto: UpdateStockInDto) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    if (stockIn.status === 'RECEIVED') {
      throw new BadRequestException('Cannot update received stock-in order');
    }

    try {
      const updatedStockIn = await this.prisma.stockIn.update({
        where: { id },
        data: {
          supplier: updateStockInDto.supplier,
          notes: updateStockInDto.notes,
        },
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              product: {
                select: { sku: true, name: true },
              },
            },
          },
        },
      });

      this.logger.log(`Stock-in updated: ${updatedStockIn.reference}`);

      return updatedStockIn;
    } catch (error) {
      this.logger.error(`Error updating stock-in ${id}: ${error.message}`, error);
      throw new BadRequestException('Failed to update stock-in order');
    }
  }

  async receive(id: string) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    if (stockIn.status === 'RECEIVED') {
      throw new BadRequestException('Stock-in order already received');
    }

    if (stockIn.status === 'CANCELLED') {
      throw new BadRequestException('Cannot receive cancelled stock-in order');
    }

    // Check approval status
    if (stockIn.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Cannot receive stock-in order that is not approved');
    }

    try {
      // Update product stock and cost price for each item
      for (const item of stockIn.items) {
        await this.productService.updateStock(item.productId, item.qty, 'add');
        
        // Update cost price
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { costPrice: item.unitCost },
        });
      }

      // Update stock-in status
      const updatedStockIn = await this.prisma.stockIn.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              product: {
                select: { sku: true, name: true, stockQty: true },
              },
            },
          },
        },
      });

      this.logger.log(`Stock-in received: ${updatedStockIn.reference} - ${stockIn.items.length} items`);

      return {
        message: 'Stock received successfully',
        stockIn: updatedStockIn,
      };
    } catch (error) {
      this.logger.error(`Error receiving stock-in ${id}: ${error.message}`, error);
      throw new BadRequestException('Failed to receive stock-in order');
    }
  }

  async cancel(id: string) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    if (stockIn.status === 'RECEIVED') {
      throw new BadRequestException('Cannot cancel received stock-in order');
    }

    if (stockIn.status === 'CANCELLED') {
      throw new BadRequestException('Stock-in order already cancelled');
    }

    const updatedStockIn = await this.prisma.stockIn.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });

    this.logger.log(`Stock-in cancelled: ${updatedStockIn.reference}`);

    return {
      message: 'Stock-in order cancelled successfully',
      stockIn: updatedStockIn,
    };
  }

  async approve(id: string, approverId: string) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    if (stockIn.status === 'CANCELLED') {
      throw new BadRequestException('Cannot approve cancelled stock-in order');
    }

    if (stockIn.status === 'RECEIVED') {
      throw new BadRequestException('Cannot approve already received stock-in order');
    }

    if (stockIn.approvalStatus === 'APPROVED') {
      throw new BadRequestException('Stock-in order already approved');
    }

    if (stockIn.approvalStatus === 'REJECTED') {
      throw new BadRequestException('Cannot approve rejected stock-in order');
    }

    const updatedStockIn = await this.prisma.stockIn.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        user: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
    });

    this.logger.log(`Stock-in approved: ${updatedStockIn.reference} by user ${approverId}`);

    return {
      message: 'Stock-in order approved successfully',
      stockIn: updatedStockIn,
    };
  }

  async reject(id: string, approverId: string, rejectionReason?: string) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    if (stockIn.status === 'CANCELLED') {
      throw new BadRequestException('Cannot reject cancelled stock-in order');
    }

    if (stockIn.status === 'RECEIVED') {
      throw new BadRequestException('Cannot reject already received stock-in order');
    }

    if (stockIn.approvalStatus === 'APPROVED') {
      throw new BadRequestException('Cannot reject approved stock-in order');
    }

    if (stockIn.approvalStatus === 'REJECTED') {
      throw new BadRequestException('Stock-in order already rejected');
    }

    const updatedStockIn = await this.prisma.stockIn.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason,
      },
      include: {
        user: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
    });

    this.logger.log(`Stock-in rejected: ${updatedStockIn.reference} by user ${approverId} - Reason: ${rejectionReason || 'No reason provided'}`);

    return {
      message: 'Stock-in order rejected successfully',
      stockIn: updatedStockIn,
    };
  }

  async remove(id: string) {
    const stockIn = await this.prisma.stockIn.findUnique({
      where: { id },
    });

    if (!stockIn) {
      throw new NotFoundException('Stock-in order not found');
    }

    if (stockIn.status === 'RECEIVED') {
      throw new BadRequestException('Cannot delete received stock-in order');
    }

    await this.prisma.stockIn.delete({
      where: { id },
    });

    this.logger.log(`Stock-in deleted: ${stockIn.reference}`);

    return { message: 'Stock-in order deleted successfully' };
  }

  async getAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalStockIns, receivedStockIns, pendingStockIns, totalValue, recentStockIns] =
      await Promise.all([
        this.prisma.stockIn.count({
          where: { createdAt: { gte: startDate } },
        }),
        this.prisma.stockIn.count({
          where: {
            createdAt: { gte: startDate },
            status: 'RECEIVED',
          },
        }),
        this.prisma.stockIn.count({
          where: {
            createdAt: { gte: startDate },
            status: 'PENDING',
          },
        }),
        this.prisma.stockIn.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: 'RECEIVED',
          },
          _sum: { totalCost: true },
        }),
        this.prisma.stockIn.findMany({
          where: { createdAt: { gte: startDate } },
          include: {
            user: { select: { name: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    return {
      period: { days, startDate, endDate: new Date() },
      summary: {
        totalStockIns,
        receivedStockIns,
        pendingStockIns,
        totalValue: totalValue._sum.totalCost || 0,
        averageValue: totalStockIns > 0 ? (totalValue._sum.totalCost || 0) / totalStockIns : 0,
      },
      recentStockIns,
    };
  }

  async getBySupplier(supplier: string) {
    return this.prisma.stockIn.findMany({
      where: {
        supplier: {
          contains: supplier,
          mode: 'insensitive',
        },
      },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            product: {
              select: { sku: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

