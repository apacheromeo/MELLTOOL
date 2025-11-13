import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Get expense categories
  async getExpenseCategories() {
    const categories = await this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return { categories };
  }

  // Get payment methods
  async getPaymentMethods() {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return { paymentMethods };
  }

  // Get accounting overview with financial stats
  async getOverview() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get all sales (revenue)
    const sales = await this.prisma.salesOrder.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        totalPrice: true,
        totalCost: true,
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalCost = sales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
    const grossProfit = totalRevenue - totalCost;

    // Get all expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        status: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING').length;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Get expenses by category
    const expensesByCategory = await this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      include: {
        expenses: {
          where: {
            expenseDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            amount: true,
          },
        },
      },
    });

    const categoryStats = expensesByCategory.map(cat => ({
      category: {
        id: cat.id,
        name: cat.name,
        nameTh: cat.nameTh,
        icon: cat.icon,
        color: cat.color,
      },
      total: cat.expenses.reduce((sum, exp) => sum + exp.amount, 0),
      count: cat.expenses.length,
    }));

    // Get recent expenses
    const recentExpenses = await this.prisma.expense.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            nameTh: true,
            icon: true,
            color: true,
          },
        },
        paymentMethod: {
          select: {
            name: true,
            nameTh: true,
          },
        },
      },
    });

    return {
      overview: {
        totalRevenue,
        totalCost,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin),
        pendingExpenses,
        expenseCount: expenses.length,
      },
      expensesByCategory: categoryStats,
      recentExpenses,
    };
  }

  // Get all expenses with pagination
  async getExpenses(
    page: number = 1,
    limit: number = 20,
    status?: string,
    categoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          paymentMethod: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Create expense
  async createExpense(createExpenseDto: CreateExpenseDto, userId: string) {
    this.logger.log(`Creating expense: ${createExpenseDto.title} by user ${userId}`);

    const expense = await this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        createdBy: userId,
      },
      include: {
        category: true,
        paymentMethod: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return expense;
  }

  // Get single expense
  async getExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        paymentMethod: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  // Update expense
  async updateExpense(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return this.prisma.expense.update({
      where: { id },
      data: updateExpenseDto,
      include: {
        category: true,
        paymentMethod: true,
      },
    });
  }

  // Delete expense
  async deleteExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.prisma.expense.delete({ where: { id } });

    return { message: 'Expense deleted successfully' };
  }

  // Get profit & loss report
  async getProfitLossReport(year?: number, month?: number) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get sales revenue
    const sales = await this.prisma.salesOrder.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalPrice: true,
        totalCost: true,
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const costOfGoodsSold = sales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
    const grossProfit = totalRevenue - costOfGoodsSold;

    // Get operating expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const totalOperatingExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalOperatingExpenses;

    // Group expenses by category name
    const expenseBreakdown = {
      rent: 0,
      utilities: 0,
      salaries: 0,
      marketing: 0,
      other: 0,
    };

    expenses.forEach(exp => {
      const catName = exp.category.name.toLowerCase();
      if (catName.includes('rent')) {
        expenseBreakdown.rent += exp.amount;
      } else if (catName.includes('utilit')) {
        expenseBreakdown.utilities += exp.amount;
      } else if (catName.includes('salary') || catName.includes('payroll') || catName.includes('wage')) {
        expenseBreakdown.salaries += exp.amount;
      } else if (catName.includes('marketing') || catName.includes('advertising')) {
        expenseBreakdown.marketing += exp.amount;
      } else {
        expenseBreakdown.other += exp.amount;
      }
    });

    return {
      period: {
        year: targetYear,
        month: targetMonth,
        startDate,
        endDate,
      },
      revenue: {
        sales: totalRevenue,
        other: 0,
        total: totalRevenue,
      },
      costs: {
        cogs: costOfGoodsSold,
        total: costOfGoodsSold,
      },
      grossProfit,
      expenses: {
        ...expenseBreakdown,
        total: totalOperatingExpenses,
      },
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
    };
  }

  // Get cash flow report
  async getCashFlowReport(year?: number, month?: number) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get previous month's closing balance (for now, we'll calculate it from previous period)
    const prevMonthStart = new Date(targetYear, targetMonth - 2, 1);
    const prevMonthEnd = new Date(targetYear, targetMonth - 1, 0);

    const prevSales = await this.prisma.salesOrder.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      select: {
        totalPrice: true,
      },
    });

    const prevExpenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
        status: 'PAID',
      },
      select: {
        amount: true,
      },
    });

    const prevStockIns = await this.prisma.stockIn.findMany({
      where: {
        status: 'RECEIVED',
        receivedAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      select: {
        totalCost: true,
      },
    });

    const prevCashIn = prevSales.reduce((sum, order) => sum + order.totalPrice, 0);
    const prevCashOut =
      prevExpenses.reduce((sum, exp) => sum + exp.amount, 0) +
      prevStockIns.reduce((sum, stock) => sum + stock.totalCost, 0);
    const openingBalance = prevCashIn - prevCashOut;

    // Cash inflows (from sales)
    const salesOrders = await this.prisma.salesOrder.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalPrice: true,
      },
    });

    const totalCashInflow = salesOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Cash outflows (from expenses and stock purchases)
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'PAID',
      },
      select: {
        amount: true,
      },
    });

    const stockIns = await this.prisma.stockIn.findMany({
      where: {
        status: 'RECEIVED',
        receivedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalCost: true,
      },
    });

    const expensesOutflow = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const stockPurchasesOutflow = stockIns.reduce((sum, stock) => sum + stock.totalCost, 0);
    const totalCashOutflow = expensesOutflow + stockPurchasesOutflow;

    const netCashFlow = totalCashInflow - totalCashOutflow;
    const closingBalance = openingBalance + netCashFlow;

    return {
      openingBalance,
      cashIn: {
        sales: totalCashInflow,
        other: 0,
        total: totalCashInflow,
      },
      cashOut: {
        expenses: expensesOutflow,
        purchases: stockPurchasesOutflow,
        total: totalCashOutflow,
      },
      netCashFlow,
      closingBalance,
    };
  }
}
