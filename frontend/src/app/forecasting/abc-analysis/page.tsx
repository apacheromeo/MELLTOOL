import ComingSoon from '@/components/ComingSoon'

export default function ABCAnalysisPage() {
  return (
    <ComingSoon
      title="ABC Analysis"
      titleTh="วิเคราะห์ ABC"
      description="Classify products by value and importance (A, B, C categories)"
      descriptionTh="จัดหมวดหมู่สินค้าตามมูลค่าและความสำคัญ (หมวด A, B, C)"
      icon="📊"
      relatedLinks={[
        { name: 'Dashboard', href: '/forecasting', description: 'Forecasting overview' },
        { name: 'All Products', href: '/inventory', description: 'View products' },
      ]}
    />
  )
}



