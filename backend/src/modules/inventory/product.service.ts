import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BarcodeService } from './barcode.service';
import * as fs from 'fs';
import * as path from 'path';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

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
          isMaster: createProductDto.isMaster || false,
          isVisible: createProductDto.isVisible !== undefined ? createProductDto.isVisible : true,
          masterProductId: createProductDto.masterProductId || null,
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
      // Filter out invisible master products at the database level
      OR: [
        { isMaster: false }, // Not a master product
        { isMaster: true, isVisible: true }, // Master product that is visible
      ],
    };

    if (search) {
      // Move OR condition to AND since we already have an OR for visibility
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameTh: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (brand) {
      where.brandId = brand;
    }

    // Note: Prisma doesn't support field-to-field comparison in where clause
    // For low stock, we need to use raw SQL or filter after fetch
    let products: any[];
    let total: number;

    if (lowStock) {
      // Use raw SQL for field comparison
      const allProducts = await this.prisma.product.findMany({
        where,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          masterProduct: {
            select: {
              id: true,
              sku: true,
              name: true,
              stockQty: true,
              isVisible: true,
            },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      });

      // Filter in memory for field comparison (low stock)
      const filteredProducts = allProducts.filter(p => {
        // For variants, use master's stock
        const actualStock = p.masterProductId && p.masterProduct
          ? p.masterProduct.stockQty
          : p.stockQty;
        const minStockThreshold = p.masterProductId && p.masterProduct
          ? 0 // Variants don't have their own minStock
          : p.minStock;
        return actualStock <= minStockThreshold;
      });
      total = filteredProducts.length;
      products = filteredProducts.slice(skip, skip + limit);
    } else {
      products = await this.prisma.product.findMany({
        where,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          masterProduct: {
            select: {
              id: true,
              sku: true,
              name: true,
              stockQty: true,
              isVisible: true,
            },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      // Count total with same filters (already filtered at database level)
      total = await this.prisma.product.count({
        where,
      });
    }

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
      // Special handling: If linking a product to a master (converting to variant)
      if (updateProductDto.masterProductId && !product.masterProductId) {
        // This product is being converted to a variant
        const master = await this.prisma.product.findUnique({
          where: { id: updateProductDto.masterProductId },
        });

        if (!master) {
          throw new BadRequestException('Master product not found');
        }

        if (!master.isMaster) {
          throw new BadRequestException('Target product is not a master product');
        }

        // Transfer variant's stock to master and zero out variant's stock
        await this.prisma.product.update({
          where: { id: updateProductDto.masterProductId },
          data: {
            stockQty: master.stockQty + product.stockQty,
          },
        });

        this.logger.log(
          `Transferred ${product.stockQty} units from variant ${product.sku} to master ${master.sku}. Master stock: ${master.stockQty} -> ${master.stockQty + product.stockQty}`
        );

        // Set variant's stock to 0 (will be managed by master)
        updateProductDto = {
          ...updateProductDto,
          stockQty: 0,
        };
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          masterProduct: {
            select: {
              id: true,
              sku: true,
              name: true,
              stockQty: true,
            },
          },
        },
      });

      this.logger.log(`Product updated: ${updatedProduct.sku} - ${updatedProduct.name}`);

      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error updating product ${id}: ${error.message}`, error);

      // Check for specific Prisma errors
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid category or brand ID provided');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU or barcode already exists');
      }

      // Return more detailed error message
      throw new BadRequestException(error.message || 'Failed to update product');
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      // Check if product has any related records
      const [stockInCount, shopeeItemCount, printJobCount, salesItemCount] = await Promise.all([
        this.prisma.stockInItem.count({ where: { productId: id } }),
        this.prisma.shopeeItem.count({ where: { productId: id } }),
        this.prisma.printJobProduct.count({ where: { productId: id } }),
        this.prisma.salesItem.count({ where: { productId: id } }),
      ]);

      const hasRelations = stockInCount > 0 || shopeeItemCount > 0 || printJobCount > 0 || salesItemCount > 0;

      if (hasRelations) {
        // Soft delete - mark as inactive if product has any relations
        const updatedProduct = await this.prisma.product.update({
          where: { id },
          data: { isActive: false },
        });

        this.logger.log(`Product soft deleted (has relations): ${updatedProduct.sku} - ${updatedProduct.name}`);

        return { message: 'Product deactivated successfully (has transaction history)' };
      } else {
        // Hard delete if no relations
        await this.prisma.product.delete({
          where: { id },
        });

        this.logger.log(`Product hard deleted: ${product.sku} - ${product.name}`);

        return { message: 'Product deleted successfully' };
      }
    } catch (error) {
      this.logger.error(`Error deleting product ${id}: ${error.message}`, error);
      throw new BadRequestException('Failed to delete product');
    }
  }

  async updateStock(productId: string, quantity: number, operation: 'add' | 'subtract' = 'add') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        masterProduct: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If this is a variant, update the master's stock instead
    const targetProductId = product.masterProductId || productId;
    const targetProduct = product.masterProductId ? product.masterProduct : product;

    if (!targetProduct) {
      throw new NotFoundException('Target product not found');
    }

    const currentStock = targetProduct.stockQty;
    const newStock = operation === 'add'
      ? currentStock + quantity
      : currentStock - quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: targetProductId },
      data: { stockQty: newStock },
    });

    this.logger.log(
      `Stock updated for ${product.masterProductId ? `variant ${product.sku} (master: ${targetProduct.sku})` : `product ${product.sku}`}: ${currentStock} -> ${newStock}`
    );

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

  async uploadImage(productId: string, file: Express.Multer.File) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate file type (images only)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed (JPEG, PNG, GIF, WebP)');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${productId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL (relative path)
    const imageUrl = `/uploads/products/${fileName}`;

    // Update product with image URL
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    this.logger.log(`Image uploaded for product: ${product.sku} - ${fileName}`);

    return {
      message: 'Image uploaded successfully',
      product: updatedProduct,
      imageUrl,
    };
  }

  // Product Compatibility Methods

  async addCompatibility(productId: string, compatibleProductIds: string[], notes?: string) {
    // Verify main product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify all compatible products exist
    const compatibleProducts = await this.prisma.product.findMany({
      where: {
        id: { in: compatibleProductIds },
        isActive: true,
      },
    });

    if (compatibleProducts.length !== compatibleProductIds.length) {
      throw new BadRequestException('One or more compatible products not found or inactive');
    }

    // Remove productId from compatibleProductIds if it exists (can't be compatible with itself)
    const filteredIds = compatibleProductIds.filter(id => id !== productId);

    if (filteredIds.length === 0) {
      throw new BadRequestException('A product cannot be compatible with itself');
    }

    // Create compatibility records
    // Note: We create the relationship in both directions for easier querying
    const compatibilityRecords = filteredIds.map(compatibleId => ({
      productId,
      compatibleProductId: compatibleId,
      notes: notes || null,
    }));

    try {
      // Use createMany with skipDuplicates to avoid conflicts
      const result = await this.prisma.productCompatibility.createMany({
        data: compatibilityRecords,
        skipDuplicates: true,
      });

      this.logger.log(`Added ${result.count} compatibility relationships for product ${product.sku}`);

      // Return the updated compatibility list
      return this.getCompatibleProducts(productId);
    } catch (error) {
      this.logger.error(`Error adding compatibility for product ${productId}: ${error.message}`, error);
      throw new BadRequestException('Failed to add product compatibility');
    }
  }

  async removeCompatibility(productId: string, compatibleProductId: string) {
    // Verify the compatibility exists
    const compatibility = await this.prisma.productCompatibility.findFirst({
      where: {
        productId,
        compatibleProductId,
      },
    });

    if (!compatibility) {
      throw new NotFoundException('Compatibility relationship not found');
    }

    try {
      // Delete the compatibility record
      await this.prisma.productCompatibility.delete({
        where: { id: compatibility.id },
      });

      this.logger.log(`Removed compatibility: ${productId} <-> ${compatibleProductId}`);

      return { message: 'Compatibility removed successfully' };
    } catch (error) {
      this.logger.error(`Error removing compatibility: ${error.message}`, error);
      throw new BadRequestException('Failed to remove product compatibility');
    }
  }

  async getCompatibleProducts(productId: string) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get all compatibility relationships where this product is either the main product or the compatible product
    const compatibilities = await this.prisma.productCompatibility.findMany({
      where: {
        OR: [
          { productId },
          { compatibleProductId: productId },
        ],
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            nameTh: true,
            imageUrl: true,
            sellPrice: true,
            stockQty: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
        compatibleProduct: {
          select: {
            id: true,
            sku: true,
            name: true,
            nameTh: true,
            imageUrl: true,
            sellPrice: true,
            stockQty: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    // Extract the compatible products (the "other" product in each relationship)
    const compatibleProductsList = compatibilities.map(comp => {
      // If this product is the main product, return the compatible product
      if (comp.productId === productId) {
        return {
          ...comp.compatibleProduct,
          compatibilityId: comp.id,
          notes: comp.notes,
          createdAt: comp.createdAt,
        };
      }
      // If this product is the compatible product, return the main product
      return {
        ...comp.product,
        compatibilityId: comp.id,
        notes: comp.notes,
        createdAt: comp.createdAt,
      };
    });

    return {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        nameTh: product.nameTh,
      },
      compatibleProducts: compatibleProductsList,
      total: compatibleProductsList.length,
    };
  }

  // Master-Variant Product Methods

  async toggleMasterVisibility(productId: string, isVisible: boolean) {
    // Verify product exists and is a master product
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isMaster) {
      throw new BadRequestException('Product is not a master product');
    }

    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: { isVisible },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          variants: {
            select: {
              id: true,
              sku: true,
              name: true,
              nameTh: true,
            },
          },
        },
      });

      this.logger.log(`Master product visibility toggled: ${product.sku} - isVisible: ${isVisible}`);

      return {
        message: `Master product ${isVisible ? 'shown' : 'hidden'} successfully`,
        product: updatedProduct,
      };
    } catch (error) {
      this.logger.error(`Error toggling visibility for product ${productId}: ${error.message}`, error);
      throw new BadRequestException('Failed to toggle master product visibility');
    }
  }

  async createVariant(masterId: string, createVariantDto: CreateVariantDto) {
    // Verify master product exists and is a master
    const masterProduct = await this.prisma.product.findUnique({
      where: { id: masterId },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!masterProduct) {
      throw new NotFoundException('Master product not found');
    }

    if (!masterProduct.isMaster) {
      throw new BadRequestException('Product is not a master product');
    }

    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createVariantDto.sku },
    });

    if (existingSku) {
      throw new ConflictException('Product with this SKU already exists');
    }

    // Check if barcode already exists (if provided)
    if (createVariantDto.barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode: createVariantDto.barcode },
      });

      if (existingBarcode) {
        throw new ConflictException('Product with this barcode already exists');
      }
    }

    try {
      // Create variant product
      // Variants share the master's stock, so stockQty is ignored
      // Variants inherit master's category, brand, costPrice
      const variant = await this.prisma.product.create({
        data: {
          sku: createVariantDto.sku,
          name: createVariantDto.name,
          nameTh: createVariantDto.nameTh,
          description: createVariantDto.description,
          descriptionTh: createVariantDto.descriptionTh,
          barcode: createVariantDto.barcode,
          imageUrl: createVariantDto.imageUrl,

          // Inherit from master
          categoryId: masterProduct.categoryId,
          brandId: masterProduct.brandId,
          costPrice: masterProduct.costPrice,

          // Variant-specific or inherit from master
          sellPrice: createVariantDto.sellPrice || masterProduct.sellPrice,

          // Stock management: variants don't have their own stock
          stockQty: 0, // Not used; stock is managed via master
          minStock: 0, // Not used; threshold is on master

          // Master-variant relationship
          isMaster: false,
          isVisible: true, // Variants are always visible
          masterProductId: masterId,
        },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          masterProduct: {
            select: {
              id: true,
              sku: true,
              name: true,
              stockQty: true,
            },
          },
        },
      });

      this.logger.log(`Variant created: ${variant.sku} for master ${masterProduct.sku}`);

      return variant;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating variant for master ${masterId}: ${error.message}`, error);
      throw new BadRequestException('Failed to create variant product');
    }
  }

  async getVariants(masterId: string) {
    // Verify master product exists
    const masterProduct = await this.prisma.product.findUnique({
      where: { id: masterId },
    });

    if (!masterProduct) {
      throw new NotFoundException('Master product not found');
    }

    if (!masterProduct.isMaster) {
      throw new BadRequestException('Product is not a master product');
    }

    // Get all variant products
    const variants = await this.prisma.product.findMany({
      where: {
        masterProductId: masterId,
        isActive: true,
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return {
      master: {
        id: masterProduct.id,
        sku: masterProduct.sku,
        name: masterProduct.name,
        nameTh: masterProduct.nameTh,
        stockQty: masterProduct.stockQty,
        isVisible: masterProduct.isVisible,
      },
      variants,
      total: variants.length,
    };
  }

  /**
   * Get the actual stock for a product (master or variant)
   * For variants, returns the master's stock
   */
  async getActualStock(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stockQty: true,
        isMaster: true,
        masterProductId: true,
        masterProduct: {
          select: {
            stockQty: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If it's a variant, return the master's stock
    if (product.masterProductId && product.masterProduct) {
      return product.masterProduct.stockQty;
    }

    // Otherwise, return the product's own stock
    return product.stockQty;
  }
}
