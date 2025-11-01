import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchProductsDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search term',
    example: 'Dyson',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Category ID filter',
    example: 'cat-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Brand ID filter',
    example: 'brand-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    description: 'Show only low stock products',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  lowStock?: boolean;

  @ApiProperty({
    description: 'Sort by field',
    example: 'name',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiProperty({
    description: 'Sort order',
    example: 'asc',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
