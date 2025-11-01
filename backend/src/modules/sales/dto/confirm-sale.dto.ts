import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmSaleDto {
  @ApiProperty({ description: 'Sales order ID to confirm' })
  @IsString()
  orderId: string;

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
}



