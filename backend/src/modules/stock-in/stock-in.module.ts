import { Module } from '@nestjs/common';
import { StockInController } from './stock-in.controller';
import { StockInService } from './stock-in.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [StockInController],
  providers: [StockInService],
  exports: [StockInService],
})
export class StockInModule {}

