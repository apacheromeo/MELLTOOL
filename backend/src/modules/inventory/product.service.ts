import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BarcodeService } from './barcode.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const {
      sku,
      name,
      nameTh,
      description,
      descriptionTh,
      weight,
      dimensions,
      color,
      costPrice,
      sellPrice,
      stockQty,
      minStock,
      maxStock,
      categoryId,
      brandId,
      isDigital = false,
    } = createProductDto;

    try {
      // Check if SKU already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }

      // Generate barcode if not provided
      let barcode = createProductDto.barcode;
      if (!barcode) {
        barcode = await this.barcodeService.generateBarcodeValue();
      }

      // Check if barcode already exists
      if (barcode) {
        const existingBarcode = await this.prisma.product.findUnique({
          where: { barcode },
        });

        if (existingBarcode) {
          barcode = await this.barcodeService.generateBarcodeValue();
        }
      }

      const product = await this.prisma.product.create({
        data: {
          sku,
          name,
          nameTh,
          description,
          descriptionTh,
          weight,
          dimensions,
          color,
          costPrice,
          sellPrice,
          stockQty: stockQty || 0,
          minStock: minStock || 0,
          maxStock,
          barcode,
          categoryId,
          brandId,
          isDigital,
        },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      });

      this.logger.log(`Product created: ${product.sku} - ${product.name}`);

      return product;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating product: ${error.message}`, error);
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(searchDto: SearchProductsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      lowStock,
      sortBy = 'name',
      sortOrder = 'asc',
    } = searchDto;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameTh: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (brand) {
      where.brandId = brand;
    }

    if (lowStock) {
      where.stockQty = { lte: where.minStock };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
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

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        stockIns: {
          include: {
            stockIn: {
              select: {
                reference: true,
                createdAt: true,
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { stockIn: { createdAt: 'desc' } },
          take: 5,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      });

      this.logger.log(`Product updated: ${updatedProduct.sku} - ${updatedProduct.name}`);

      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error updating product ${id}: ${error.message}`, error);
      throw new BadRequestException('Failed to update product');
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product has stock-in records
    const stockInCount = await this.prisma.stockInItem.count({
      where: { productId: id },
    });

    if (stockInCount > 0) {
      // Soft delete - mark as inactive
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Product soft deleted: ${updatedProduct.sku} - ${updatedProduct.name}`);

      return { message: 'Product deactivated successfully' };
    } else {
      // Hard delete if no stock-in records
      await this.prisma.product.delete({
        where: { id },
      });

      this.logger.log(`Product hard deleted: ${product.sku} - ${product.name}`);

      return { message: 'Product deleted successfully' };
    }
  }

  async updateStock(productId: string, quantity: number, operation: 'add' | 'subtract' = 'add') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = operation === 'add' 
      ? product.stockQty + quantity 
      : product.stockQty - quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { stockQty: newStock },
    });

    this.logger.log(`Stock updated for product ${product.sku}: ${product.stockQty} -> ${newStock}`);

    return updatedProduct;
  }

  async getByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
