import ComingSoon from '@/components/ComingSoon'

export default function TrendsPage() {
  return (
    <ComingSoon
      title="Trend Analysis"
      titleTh="วิเคราะห์แนวโน้ม"
      description="Analyze sales trends and seasonal patterns"
      descriptionTh="วิเคราะห์แนวโน้มการขายและรูปแบบตามฤดูกาล"
      icon="📈"
      relatedLinks={[
        { name: 'Dashboard', href: '/forecasting', description: 'Forecasting overview' },
        { name: 'Sales Reports', href: '/sales/reports', description: 'View sales' },
      ]}
    />
  )
}



