import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AutocompleteDto {
  @ApiProperty({
    description: 'Search query (minimum 2 characters)',
    minLength: 2,
    example: 'iph'
  })
  @IsString()
  @MinLength(2)
  query: string;
}
