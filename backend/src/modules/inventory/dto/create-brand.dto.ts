import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Brand name in English',
    example: 'Dyson',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Brand name in Thai',
    example: 'ไดสัน',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiProperty({
    description: 'Brand logo URL',
    example: 'https://example.com/dyson-logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;
}
