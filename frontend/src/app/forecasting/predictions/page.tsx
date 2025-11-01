import ComingSoon from '@/components/ComingSoon'

export default function PredictionsPage() {
  return (
    <ComingSoon
      title="Stock Predictions"
      titleTh="ทำนายสต็อก"
      description="AI-powered stock level predictions for the next 30-90 days"
      descriptionTh="ทำนายระดับสต็อกด้วย AI สำหรับ 30-90 วันข้างหน้า"
      icon="🔮"
      relatedLinks={[
        { name: 'Dashboard', href: '/forecasting', description: 'Forecasting overview' },
        { name: 'Reorder Points', href: '/forecasting/reorder', description: 'When to reorder' },
      ]}
    />
  )
}



