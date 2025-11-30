import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { BrandService } from './brand.service';
import { BarcodeService } from './barcode.service';
import { ProductImportService } from './product-import.service';
import { StockAdjustmentService } from './stock-adjustment.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { ProductRepository } from './repositories/product.repository';
import { CategoryRepository } from './repositories/category.repository';
import { BrandRepository } from './repositories/brand.repository';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'inventory-sync',
    }),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    ProductService,
    CategoryService,
    BrandService,
    BarcodeService,
    ProductImportService,
    StockAdjustmentService,
    InventoryRepository,
    ProductRepository,
    CategoryRepository,
    BrandRepository,
  ],
  exports: [
    InventoryService,
    ProductService,
    CategoryService,
    BrandService,
    BarcodeService,
  ],
})
export class InventoryModule {}
