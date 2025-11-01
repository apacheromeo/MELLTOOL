import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePrintJobDto {
  @ApiProperty({
    description: 'Product IDs to print',
    example: ['prod-123', 'prod-456'],
  })
  @IsArray()
  productIds: string[];

  @ApiProperty({
    description: 'Number of copies per product',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  copiesPerProduct?: number;
}

