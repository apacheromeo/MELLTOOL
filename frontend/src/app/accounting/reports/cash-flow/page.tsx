import ComingSoon from '@/components/ComingSoon'

export default function CashFlowPage() {
  return (
    <ComingSoon
      title="Cash Flow Statement"
      titleTh="งบกระแสเงินสด"
      description="Track cash inflows and outflows"
      descriptionTh="ติดตามกระแสเงินสดเข้าและออก"
      icon="💵"
      relatedLinks={[
        { name: 'Financial Reports', href: '/accounting/reports', description: 'All reports' },
        { name: 'Profit & Loss', href: '/accounting/reports/profit-loss', description: 'P&L statement' },
      ]}
    />
  )
}



