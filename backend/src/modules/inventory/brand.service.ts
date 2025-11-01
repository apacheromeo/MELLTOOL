import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    const { name, nameTh, logo } = createBrandDto;

    try {
      // Check if brand with same name already exists
      const existingBrand = await this.prisma.brand.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: 'insensitive' } },
            { nameTh: { equals: nameTh, mode: 'insensitive' } },
          ],
        },
      });

      if (existingBrand) {
        throw new ConflictException('Brand with this name already exists');
      }

      const brand = await this.prisma.brand.create({
        data: {
          name,
          nameTh,
          logo,
        },
      });

      this.logger.log(`Brand created: ${brand.name}`);

      return brand;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating brand: ${error.message}`, error);
      throw new Error('Failed to create brand');
    }
  }

  async findAll() {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            name: true,
            stockQty: true,
            costPrice: true,
            category: { select: { name: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    try {
      const updatedBrand = await this.prisma.brand.update({
        where: { id },
        data: updateBrandDto,
      });

      this.logger.log(`Brand updated: ${updatedBrand.name}`);

      return updatedBrand;
    } catch (error) {
      this.logger.error(`Error updating brand ${id}: ${error.message}`, error);
      throw new Error('Failed to update brand');
    }
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Check if brand has products
    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      // Soft delete - mark as inactive
      const updatedBrand = await this.prisma.brand.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Brand soft deleted: ${updatedBrand.name}`);

      return { message: 'Brand deactivated successfully' };
    } else {
      // Hard delete if no products
      await this.prisma.brand.delete({
        where: { id },
      });

      this.logger.log(`Brand hard deleted: ${brand.name}`);

      return { message: 'Brand deleted successfully' };
    }
  }

  async getBrandStats() {
    const [totalBrands, activeBrands, brandsWithProducts] = await Promise.all([
      this.prisma.brand.count(),
      this.prisma.brand.count({ where: { isActive: true } }),
      this.prisma.brand.count({
        where: {
          isActive: true,
          products: { some: { isActive: true } },
        },
      }),
    ]);

    return {
      totalBrands,
      activeBrands,
      brandsWithProducts,
    };
  }
}
