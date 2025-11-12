import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuickStartDto {
  @ApiPropertyOptional({ description: 'Optional search query to filter products' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Number of trending products to show', default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  trendingLimit?: number = 6;

  @ApiPropertyOptional({ description: 'Number of recent products to show', default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  recentLimit?: number = 6;
}
