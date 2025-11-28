import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ReturnOrderDto {
  @ApiProperty({ description: 'Order ID to return' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Shipping cost for return (round trip to warehouse)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @ApiProperty({ description: 'Reason for return', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
