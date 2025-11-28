import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SalesChannel {
  POS = 'POS',
  SHOPEE = 'SHOPEE',
  LAZADA = 'LAZADA',
  LINE = 'LINE',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  WEBSITE = 'WEBSITE',
  OTHER = 'OTHER',
}

export class CreateSalesOrderDto {
  @ApiPropertyOptional({ description: 'Order number (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Sales channel', enum: SalesChannel })
  @IsOptional()
  @IsEnum(SalesChannel)
  channel?: SalesChannel;
}



