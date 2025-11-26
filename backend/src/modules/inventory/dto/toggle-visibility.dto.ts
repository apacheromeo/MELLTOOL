import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleVisibilityDto {
  @ApiProperty({
    description: 'Visibility status for master product',
    example: true,
  })
  @IsBoolean()
  isVisible: boolean;
}
