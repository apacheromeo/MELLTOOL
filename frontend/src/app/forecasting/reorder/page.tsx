import ComingSoon from '@/components/ComingSoon'

export default function ReorderPage() {
  return (
    <ComingSoon
      title="Reorder Points"
      titleTh="จุดสั่งซื้อใหม่"
      description="Optimal reorder points and quantities for each product"
      descriptionTh="จุดสั่งซื้อและปริมาณที่เหมาะสมสำหรับแต่ละสินค้า"
      icon="📍"
      relatedLinks={[
        { name: 'Stock Predictions', href: '/forecasting/predictions', description: 'View predictions' },
        { name: 'Low Stock', href: '/inventory/low-stock', description: 'Low stock items' },
      ]}
    />
  )
}



