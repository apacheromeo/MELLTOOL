import ComingSoon from '@/components/ComingSoon'

export default function PromotionsPage() {
  return (
    <ComingSoon
      title="Promotion Forecasts"
      titleTh="พยากรณ์โปรโมชั่น"
      description="Predict demand for special events like 11/11, Black Friday, etc."
      descriptionTh="ทำนายความต้องการสำหรับกิจกรรมพิเศษ เช่น 11/11, Black Friday เป็นต้น"
      icon="🎉"
      relatedLinks={[
        { name: 'Dashboard', href: '/forecasting', description: 'Forecasting overview' },
        { name: 'Trend Analysis', href: '/forecasting/trends', description: 'View trends' },
      ]}
    />
  )
}



