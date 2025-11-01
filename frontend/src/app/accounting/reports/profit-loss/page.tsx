import ComingSoon from '@/components/ComingSoon'

export default function ProfitLossPage() {
  return (
    <ComingSoon
      title="Profit & Loss Statement"
      titleTh="งบกำไรขาดทุน"
      description="Detailed profit and loss statement"
      descriptionTh="งบกำไรขาดทุนโดยละเอียด"
      icon="📊"
      relatedLinks={[
        { name: 'Financial Reports', href: '/accounting/reports', description: 'All reports' },
        { name: 'Cash Flow', href: '/accounting/reports/cash-flow', description: 'Cash flow statement' },
      ]}
    />
  )
}



