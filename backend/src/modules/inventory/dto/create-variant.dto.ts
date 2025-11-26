import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({
    description: 'Variant SKU (must be unique)',
    example: 'HEPA-X20-PLUS',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Variant name in English',
    example: 'HEPA Filter for Xiaomi X20+',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Variant name in Thai',
    example: 'ไส้กรอง HEPA สำหรับ Xiaomi X20+',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiProperty({
    description: 'Variant description in English',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Variant description in Thai',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionTh?: string;

  @ApiProperty({
    description: 'Variant barcode (must be unique)',
    example: 'HEPA-X20-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    description: 'Selling price for this variant (if different from master)',
    example: 299,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @ApiProperty({
    description: 'Image URL for this variant',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
