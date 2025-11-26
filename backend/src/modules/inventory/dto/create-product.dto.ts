import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product SKU',
    example: 'VAC-001',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Product name in English',
    example: 'Dyson V15 Vacuum Cleaner',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product name in Thai',
    example: 'เครื่องดูดฝุ่น Dyson V15',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiProperty({
    description: 'Product description in English',
    example: 'High-performance cordless vacuum cleaner',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Product description in Thai',
    example: 'เครื่องดูดฝุ่นไร้สายประสิทธิภาพสูง',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionTh?: string;

  @ApiProperty({
    description: 'Product weight in grams',
    example: 2500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    description: 'Product dimensions (LxWxH)',
    example: '30x25x120',
    required: false,
  })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({
    description: 'Product color',
    example: 'Yellow',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Cost price',
    example: 15000,
  })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty({
    description: 'Selling price',
    example: 20000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @ApiProperty({
    description: 'Initial stock quantity',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQty?: number;

  @ApiProperty({
    description: 'Minimum stock level',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiProperty({
    description: 'Maximum stock level',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiProperty({
    description: 'Product barcode',
    example: 'VAC12345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 'cat-123',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: 'Brand ID',
    example: 'brand-123',
  })
  @IsString()
  brandId: string;

  @ApiProperty({
    description: 'Is digital product',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiProperty({
    description: 'Is this a master product (parent for variants)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isMaster?: boolean;

  @ApiProperty({
    description: 'Is master product visible in listings',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Master product ID (for variant products)',
    example: 'prod-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  masterProductId?: string;
}
