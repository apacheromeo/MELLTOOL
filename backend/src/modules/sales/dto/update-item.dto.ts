import { IsString, IsInt, Min, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateItemDto {
  @ApiProperty({ description: 'Sales item ID' })
  @IsString()
  itemId: string;

  @ApiPropertyOptional({ description: 'New quantity', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'New unit price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}



