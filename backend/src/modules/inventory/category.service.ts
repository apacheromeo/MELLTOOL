import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, nameTh, description, color, icon } = createCategoryDto;

    try {
      // Check if category with same name already exists
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: 'insensitive' } },
            { nameTh: { equals: nameTh, mode: 'insensitive' } },
          ],
        },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }

      const category = await this.prisma.category.create({
        data: {
          name,
          nameTh,
          description,
          color,
          icon,
        },
      });

      this.logger.log(`Category created: ${category.name}`);

      return category;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating category: ${error.message}`, error);
      throw new Error('Failed to create category');
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
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
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            name: true,
            stockQty: true,
            costPrice: true,
            brand: { select: { name: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });

      this.logger.log(`Category updated: ${updatedCategory.name}`);

      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating category ${id}: ${error.message}`, error);
      throw new Error('Failed to update category');
    }
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      // Soft delete - mark as inactive
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Category soft deleted: ${updatedCategory.name}`);

      return { message: 'Category deactivated successfully' };
    } else {
      // Hard delete if no products
      await this.prisma.category.delete({
        where: { id },
      });

      this.logger.log(`Category hard deleted: ${category.name}`);

      return { message: 'Category deleted successfully' };
    }
  }

  async getCategoryStats() {
    const [totalCategories, activeCategories, categoriesWithProducts] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.category.count({
        where: {
          isActive: true,
          products: { some: { isActive: true } },
        },
      }),
    ]);

    return {
      totalCategories,
      activeCategories,
      categoriesWithProducts,
    };
  }
}
