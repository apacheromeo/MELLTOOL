import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name in English',
    example: 'Vacuum Cleaners',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category name in Thai',
    example: 'เครื่องดูดฝุ่น',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiProperty({
    description: 'Category description',
    example: 'All types of vacuum cleaners and accessories',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category color for UI visualization',
    example: '#3B82F6',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
}
