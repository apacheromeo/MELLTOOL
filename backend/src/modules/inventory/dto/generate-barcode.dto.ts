import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class GenerateBarcodeDto {
  @ApiProperty({
    description: 'Barcode width',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  width?: number = 2;

  @ApiProperty({
    description: 'Barcode height',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(200)
  height?: number = 100;

  @ApiProperty({
    description: 'Font size',
    example: 14,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(24)
  fontSize?: number = 14;

  @ApiProperty({
    description: 'Display value',
    example: true,
    required: false,
  })
  @IsOptional()
  displayValue?: boolean = true;

  @ApiProperty({
    description: 'Background color',
    example: '#ffffff',
    required: false,
  })
  @IsOptional()
  @IsString()
  background?: string = '#ffffff';

  @ApiProperty({
    description: 'Line color',
    example: '#000000',
    required: false,
  })
  @IsOptional()
  @IsString()
  lineColor?: string = '#000000';
}
