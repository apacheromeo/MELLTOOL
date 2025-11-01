import { PartialType } from '@nestjs/swagger';
import { CreateStockInDto } from './create-stock-in.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateStockInDto extends PartialType(
  OmitType(CreateStockInDto, ['reference', 'items'] as const),
) {}

