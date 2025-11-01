import { IsString, IsInt, Min, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddItemDto {
  @ApiProperty({ description: 'Sales order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Product SKU or barcode' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;

  @ApiPropertyOptional({ description: 'Override unit price (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}



