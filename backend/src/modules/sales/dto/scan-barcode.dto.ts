import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanBarcodeDto {
  @ApiProperty({ description: 'Sales order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Scanned barcode value' })
  @IsString()
  barcodeValue: string;
}



