import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ description: 'Customer name', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: 'Customer phone', required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ description: 'Payment method', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Order notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
