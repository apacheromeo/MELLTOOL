import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@ApiBearerAuth()
export class AccountingController {
  private readonly logger = new Logger(AccountingController.name);

  constructor(private readonly accountingService: AccountingService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get accounting overview with financial stats' })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  async getOverview() {
    return this.accountingService.getOverview();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all expense categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getExpenseCategories() {
    return this.accountingService.getExpenseCategories();
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get all payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  async getPaymentMethods() {
    return this.accountingService.getPaymentMethods();
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get all expenses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getExpenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.accountingService.getExpenses(pageNum, limitNum, status, categoryId, startDate, endDate);
  }

  @Post('expenses')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create expense (Owner only)' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  async createExpense(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    this.logger.log(`Creating expense: ${createExpenseDto.title} by user: ${req.user.email}`);
    return this.accountingService.createExpense(createExpenseDto, req.user.id);
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense found' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async getExpense(@Param('id') id: string) {
    return this.accountingService.getExpense(id);
  }

  @Patch('expenses/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update expense (Owner only)' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  async updateExpense(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req,
  ) {
    this.logger.log(`Updating expense ${id} by user: ${req.user.email}`);
    return this.accountingService.updateExpense(id, updateExpenseDto);
  }

  @Delete('expenses/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete expense (Owner only)' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  async deleteExpense(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting expense ${id} by user: ${req.user.email}`);
    return this.accountingService.deleteExpense(id);
  }

  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Get profit & loss report' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  async getProfitLossReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) : undefined;
    return this.accountingService.getProfitLossReport(yearNum, monthNum);
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Get cash flow report' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  async getCashFlowReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) : undefined;
    return this.accountingService.getCashFlowReport(yearNum, monthNum);
  }
}
