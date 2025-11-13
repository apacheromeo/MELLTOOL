import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseStatus } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Expense title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Expense description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Expense amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Expense date (YYYY-MM-DD)' })
  @IsDateString()
  expenseDate: string;

  @ApiProperty({ description: 'Category ID' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Payment method ID' })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Attachment URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: 'Expense status', enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;
}
