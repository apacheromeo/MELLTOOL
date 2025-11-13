const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding accounting data...');

  // Seed Expense Categories
  const categories = [
    {
      name: 'Rent',
      nameTh: 'ค่าเช่า',
      description: 'Office and warehouse rent',
      color: '#3B82F6',
      icon: '🏢',
    },
    {
      name: 'Utilities',
      nameTh: 'สาธารณูปโภค',
      description: 'Electricity, water, internet',
      color: '#10B981',
      icon: '💡',
    },
    {
      name: 'Salaries',
      nameTh: 'เงินเดือน',
      description: 'Employee salaries and wages',
      color: '#8B5CF6',
      icon: '👥',
    },
    {
      name: 'Marketing',
      nameTh: 'การตลาด',
      description: 'Marketing and advertising expenses',
      color: '#F59E0B',
      icon: '📢',
    },
    {
      name: 'Office Supplies',
      nameTh: 'อุปกรณ์สำนักงาน',
      description: 'Stationery, printer supplies, etc.',
      color: '#6366F1',
      icon: '📎',
    },
    {
      name: 'Transportation',
      nameTh: 'ค่าขนส่ง',
      description: 'Delivery and transportation costs',
      color: '#EC4899',
      icon: '🚚',
    },
    {
      name: 'Maintenance',
      nameTh: 'ค่าบำรุงรักษา',
      description: 'Equipment and facility maintenance',
      color: '#14B8A6',
      icon: '🔧',
    },
    {
      name: 'Other',
      nameTh: 'อื่นๆ',
      description: 'Other miscellaneous expenses',
      color: '#6B7280',
      icon: '📝',
    },
  ];

  for (const category of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Expense categories seeded');

  // Seed Payment Methods
  const paymentMethods = [
    {
      name: 'Cash',
      nameTh: 'เงินสด',
      description: 'Cash payment',
    },
    {
      name: 'Bank Transfer',
      nameTh: 'โอนเงิน',
      description: 'Bank transfer payment',
    },
    {
      name: 'Credit Card',
      nameTh: 'บัตรเครดิต',
      description: 'Credit card payment',
    },
    {
      name: 'Debit Card',
      nameTh: 'บัตรเดบิต',
      description: 'Debit card payment',
    },
    {
      name: 'Mobile Banking',
      nameTh: 'แอปธนาคาร',
      description: 'Mobile banking payment',
    },
    {
      name: 'PromptPay',
      nameTh: 'พร้อมเพย์',
      description: 'PromptPay QR payment',
    },
    {
      name: 'Check',
      nameTh: 'เช็ค',
      description: 'Check payment',
    },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: {},
      create: method,
    });
  }

  console.log('✅ Payment methods seeded');
  console.log('✅ Accounting data seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding accounting data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
