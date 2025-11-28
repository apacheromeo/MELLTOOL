import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ description: 'Order ID to cancel' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Reason for cancellation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Whether this cancellation requires admin approval (for staff)', required: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
