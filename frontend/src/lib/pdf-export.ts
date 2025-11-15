import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, ChartConfiguration } from 'chart.js/auto';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable?: { finalY: number };
  }
}

// Brand colors
const COLORS = {
  primary: '#2563eb', // blue-600
  secondary: '#64748b', // slate-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  purple: '#8b5cf6', // violet-500
  info: '#06b6d4', // cyan-500
};

/**
 * Create a chart as base64 image
 */
async function createChartImage(
  config: ChartConfiguration,
  width: number = 400,
  height: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const chart = new Chart(ctx, config);

    // Wait for chart to render
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      resolve(imageData);
    }, 500);
  });
}

/**
 * Add header with logo and title to PDF
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Company name/logo
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('MELLTOOL', 20, 20);

  // Report title
  doc.setFontSize(16);
  doc.setTextColor('#1f2937');
  doc.text(title, 20, 32);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor('#6b7280');
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, 40);
  }

  // Date
  doc.setFontSize(9);
  doc.setTextColor('#9ca3af');
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${date}`, doc.internal.pageSize.getWidth() - 20, 20, {
    align: 'right',
  });

  // Line separator
  doc.setDrawColor('#e5e7eb');
  doc.setLineWidth(0.5);
  doc.line(20, subtitle ? 45 : 38, doc.internal.pageSize.getWidth() - 20, subtitle ? 45 : 38);

  return subtitle ? 50 : 43;
}

/**
 * Add footer with page numbers
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#9ca3af');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}

/**
 * Export Sales Report as PDF
 */
export async function exportSalesReportPDF(data: {
  dailySales: Array<{ date: string; orders: number; revenue: number; profit: number }>;
  dateRange: string;
}) {
  const doc = new jsPDF();

  let yPos = addHeader(
    doc,
    'Sales Report',
    `Period: ${data.dateRange} | ${data.dailySales.length} days`
  );

  yPos += 10;

  // Summary cards
  const totalOrders = data.dailySales.reduce((sum, day) => sum + day.orders, 0);
  const totalRevenue = data.dailySales.reduce((sum, day) => sum + day.revenue, 0);
  const totalProfit = data.dailySales.reduce((sum, day) => sum + day.profit, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Summary boxes
  doc.setFillColor(COLORS.primary);
  doc.roundedRect(20, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.success);
  doc.roundedRect(80, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.warning);
  doc.roundedRect(140, yPos, 55, 25, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Total Orders', 25, yPos + 8);
  doc.text('Total Revenue', 85, yPos + 8);
  doc.text('Total Profit', 145, yPos + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(totalOrders.toString(), 25, yPos + 18);
  doc.text(`฿${totalRevenue.toLocaleString()}`, 85, yPos + 18);
  doc.text(`฿${totalProfit.toLocaleString()}`, 145, yPos + 18);

  yPos += 35;

  // Revenue Chart
  try {
    const revenueChartImage = await createChartImage({
      type: 'bar',
      data: {
        labels: data.dailySales.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Revenue',
            data: data.dailySales.map(d => d.revenue),
            backgroundColor: COLORS.primary,
            borderRadius: 4,
          },
          {
            label: 'Profit',
            data: data.dailySales.map(d => d.profit),
            backgroundColor: COLORS.success,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Daily Revenue & Profit' },
        },
      },
    }, 600, 250);

    doc.addImage(revenueChartImage, 'PNG', 20, yPos, 170, 70);
    yPos += 80;
  } catch (error) {
    console.error('Failed to generate revenue chart:', error);
    yPos += 10;
  }

  // Orders Chart
  try {
    const ordersChartImage = await createChartImage({
      type: 'line',
      data: {
        labels: data.dailySales.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Orders',
            data: data.dailySales.map(d => d.orders),
            borderColor: COLORS.purple,
            backgroundColor: `${COLORS.purple}33`,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Daily Orders Trend' },
        },
      },
    }, 600, 200);

    doc.addImage(ordersChartImage, 'PNG', 20, yPos, 170, 60);
    yPos += 70;
  } catch (error) {
    console.error('Failed to generate orders chart:', error);
    yPos += 10;
  }

  // Daily breakdown table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#1f2937');
  doc.text('Daily Breakdown', 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Orders', 'Revenue (฿)', 'Profit (฿)', 'Avg Order (฿)', 'Margin (%)']],
    body: data.dailySales.map(day => [
      new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      day.orders.toString(),
      day.revenue.toLocaleString(),
      day.profit.toLocaleString(),
      (day.revenue / day.orders).toFixed(2),
      ((day.profit / day.revenue) * 100).toFixed(1),
    ]),
    foot: [[
      'TOTAL',
      totalOrders.toString(),
      totalRevenue.toLocaleString(),
      totalProfit.toLocaleString(),
      avgOrderValue.toFixed(2),
      profitMargin.toFixed(1),
    ]],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 10 },
    footStyles: { fillColor: '#f3f4f6', textColor: '#1f2937', fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  addFooter(doc);
  doc.save(`sales-report-${data.dateRange}-${Date.now()}.pdf`);
}

/**
 * Export Low Stock Report as PDF
 */
export async function exportLowStockReportPDF(data: {
  products: Array<{
    sku: string;
    name: string;
    nameTh: string;
    category: string;
    currentStock: number;
    minStock: number;
    stockPercentage: number;
    urgency: 'critical' | 'warning' | 'low';
    supplier: string;
    price: number;
  }>;
}) {
  const doc = new jsPDF();

  let yPos = addHeader(
    doc,
    'Low Stock Alert Report',
    `${data.products.length} products need attention`
  );

  yPos += 10;

  // Summary by urgency
  const criticalCount = data.products.filter(p => p.urgency === 'critical').length;
  const warningCount = data.products.filter(p => p.urgency === 'warning').length;
  const lowCount = data.products.filter(p => p.urgency === 'low').length;

  // Summary boxes
  doc.setFillColor(COLORS.danger);
  doc.roundedRect(20, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.warning);
  doc.roundedRect(80, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.info);
  doc.roundedRect(140, yPos, 55, 25, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Critical (<10%)', 25, yPos + 8);
  doc.text('Warning (10-20%)', 85, yPos + 8);
  doc.text('Low (20-30%)', 145, yPos + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(criticalCount.toString(), 25, yPos + 18);
  doc.text(warningCount.toString(), 85, yPos + 18);
  doc.text(lowCount.toString(), 145, yPos + 18);

  yPos += 35;

  // Urgency distribution chart
  try {
    const urgencyChartImage = await createChartImage({
      type: 'doughnut',
      data: {
        labels: ['Critical', 'Warning', 'Low'],
        datasets: [{
          data: [criticalCount, warningCount, lowCount],
          backgroundColor: [COLORS.danger, COLORS.warning, COLORS.info],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'right' },
          title: { display: true, text: 'Stock Alert Distribution' },
        },
      },
    }, 500, 200);

    doc.addImage(urgencyChartImage, 'PNG', 40, yPos, 130, 50);
    yPos += 60;
  } catch (error) {
    console.error('Failed to generate urgency chart:', error);
    yPos += 10;
  }

  // Products table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#1f2937');
  doc.text('Low Stock Products', 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['SKU', 'Product', 'Category', 'Current', 'Min', 'Stock %', 'Urgency', 'Supplier']],
    body: data.products.map(p => [
      p.sku,
      p.name,
      p.category,
      p.currentStock.toString(),
      p.minStock.toString(),
      `${p.stockPercentage.toFixed(1)}%`,
      p.urgency.toUpperCase(),
      p.supplier,
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      6: {
        cellWidth: 20,
        cellPadding: 2,
      },
    },
    didParseCell: (data) => {
      // Color code urgency column
      if (data.column.index === 6 && data.section === 'body') {
        const urgency = data.cell.raw as string;
        if (urgency === 'CRITICAL') {
          data.cell.styles.fillColor = '#fee2e2';
          data.cell.styles.textColor = '#991b1b';
        } else if (urgency === 'WARNING') {
          data.cell.styles.fillColor = '#fef3c7';
          data.cell.styles.textColor = '#92400e';
        } else if (urgency === 'LOW') {
          data.cell.styles.fillColor = '#dbeafe';
          data.cell.styles.textColor = '#1e40af';
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`low-stock-report-${Date.now()}.pdf`);
}

/**
 * Export Expense Report as PDF
 */
export async function exportExpenseReportPDF(data: {
  expenses: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    status: string;
    paymentMethod: string;
  }>;
  categories: any[];
}) {
  const doc = new jsPDF();

  let yPos = addHeader(
    doc,
    'Expense Report',
    `${data.expenses.length} expense entries`
  );

  yPos += 10;

  // Calculate totals
  const totalExpense = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpense = data.expenses.filter(e => e.status === 'PAID').reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpense = data.expenses.filter(e => e.status === 'PENDING').reduce((sum, exp) => sum + exp.amount, 0);

  // Summary boxes
  doc.setFillColor(COLORS.danger);
  doc.roundedRect(20, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.success);
  doc.roundedRect(80, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.warning);
  doc.roundedRect(140, yPos, 55, 25, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Total Expense', 25, yPos + 8);
  doc.text('Paid', 85, yPos + 8);
  doc.text('Pending', 145, yPos + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`฿${totalExpense.toLocaleString()}`, 25, yPos + 18);
  doc.text(`฿${paidExpense.toLocaleString()}`, 85, yPos + 18);
  doc.text(`฿${pendingExpense.toLocaleString()}`, 145, yPos + 18);

  yPos += 35;

  // Expense by category
  const categoryTotals = data.expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  try {
    const categoryChartImage = await createChartImage({
      type: 'pie',
      data: {
        labels: Object.keys(categoryTotals),
        datasets: [{
          data: Object.values(categoryTotals),
          backgroundColor: [
            COLORS.primary,
            COLORS.success,
            COLORS.warning,
            COLORS.danger,
            COLORS.purple,
            COLORS.info,
          ],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'right' },
          title: { display: true, text: 'Expense by Category' },
        },
      },
    }, 500, 200);

    doc.addImage(categoryChartImage, 'PNG', 40, yPos, 130, 50);
    yPos += 60;
  } catch (error) {
    console.error('Failed to generate category chart:', error);
    yPos += 10;
  }

  // Expenses table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#1f2937');
  doc.text('Expense Details', 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Description', 'Category', 'Amount (฿)', 'Status', 'Payment Method']],
    body: data.expenses.map(exp => [
      new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      exp.description,
      exp.category,
      exp.amount.toLocaleString(),
      exp.status,
      exp.paymentMethod,
    ]),
    foot: [['', '', 'TOTAL', totalExpense.toLocaleString(), '', '']],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    footStyles: { fillColor: '#f3f4f6', textColor: '#1f2937', fontStyle: 'bold' },
    styles: { fontSize: 8 },
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'PAID') {
          data.cell.styles.fillColor = '#d1fae5';
          data.cell.styles.textColor = '#065f46';
        } else if (status === 'PENDING') {
          data.cell.styles.fillColor = '#fef3c7';
          data.cell.styles.textColor = '#92400e';
        } else if (status === 'REJECTED') {
          data.cell.styles.fillColor = '#fee2e2';
          data.cell.styles.textColor = '#991b1b';
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`expense-report-${Date.now()}.pdf`);
}

/**
 * Export Stock Movement Report as PDF
 */
export async function exportStockMovementReportPDF(data: {
  movements: Array<{
    date: string;
    type: 'IN' | 'OUT';
    product: string;
    quantity: number;
    reference: string;
    notes: string;
  }>;
  dateRange: string;
}) {
  const doc = new jsPDF();

  let yPos = addHeader(
    doc,
    'Stock Movement Report',
    `Period: ${data.dateRange} | ${data.movements.length} movements`
  );

  yPos += 10;

  // Calculate totals
  const totalIn = data.movements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
  const totalOut = data.movements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
  const netMovement = totalIn - totalOut;

  // Summary boxes
  doc.setFillColor(COLORS.success);
  doc.roundedRect(20, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.danger);
  doc.roundedRect(80, yPos, 55, 25, 2, 2, 'F');
  doc.setFillColor(COLORS.info);
  doc.roundedRect(140, yPos, 55, 25, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Stock In', 25, yPos + 8);
  doc.text('Stock Out', 85, yPos + 8);
  doc.text('Net Movement', 145, yPos + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`+${totalIn}`, 25, yPos + 18);
  doc.text(`-${totalOut}`, 85, yPos + 18);
  doc.text(netMovement.toString(), 145, yPos + 18);

  yPos += 35;

  // Movement chart
  try {
    const movementChartImage = await createChartImage({
      type: 'bar',
      data: {
        labels: ['Stock In', 'Stock Out'],
        datasets: [{
          label: 'Quantity',
          data: [totalIn, totalOut],
          backgroundColor: [COLORS.success, COLORS.danger],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Stock In vs Stock Out' },
        },
      },
    }, 500, 200);

    doc.addImage(movementChartImage, 'PNG', 40, yPos, 130, 50);
    yPos += 60;
  } catch (error) {
    console.error('Failed to generate movement chart:', error);
    yPos += 10;
  }

  // Movements table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#1f2937');
  doc.text('Stock Movement Details', 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Type', 'Product', 'Quantity', 'Reference', 'Notes']],
    body: data.movements.map(m => [
      new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      m.type,
      m.product,
      m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`,
      m.reference,
      m.notes,
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 8 },
    didParseCell: (data) => {
      // Color code type column
      if (data.column.index === 1 && data.section === 'body') {
        const type = data.cell.raw as string;
        if (type === 'IN') {
          data.cell.styles.fillColor = '#d1fae5';
          data.cell.styles.textColor = '#065f46';
        } else if (type === 'OUT') {
          data.cell.styles.fillColor = '#fee2e2';
          data.cell.styles.textColor = '#991b1b';
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`stock-movement-report-${data.dateRange}-${Date.now()}.pdf`);
}
