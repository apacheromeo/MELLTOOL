import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class StockInItemDto {
  @ApiProperty({ description: 'Product ID', example: 'prod-123' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity', example: 10 })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({ description: 'Unit cost', example: 1500 })
  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreateStockInDto {
  @ApiProperty({
    description: 'Reference number (invoice/receipt)',
    example: 'INV-2024-001',
  })
  @IsString()
  reference: string;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Dyson Thailand',
    required: false,
  })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Bulk order for promotion',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Stock-in items',
    type: [StockInItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockInItemDto)
  items: StockInItemDto[];
}

