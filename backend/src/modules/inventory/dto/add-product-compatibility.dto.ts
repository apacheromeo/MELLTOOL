import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class AddProductCompatibilityDto {
  @ApiProperty({
    description: 'Array of compatible product IDs to link with the main product',
    example: ['clg1234567890', 'clg0987654321'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  compatibleProductIds: string[];

  @ApiProperty({
    description: 'Optional notes about the compatibility relationship',
    example: 'Compatible filter models',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
