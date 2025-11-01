import ComingSoon from '@/components/ComingSoon'

export default function PaymentMethodsPage() {
  return (
    <ComingSoon
      title="Payment Methods"
      titleTh="วิธีการชำระเงิน"
      description="Configure available payment methods"
      descriptionTh="กำหนดค่าวิธีการชำระเงินที่มี"
      icon="💳"
      relatedLinks={[
        { name: 'Settings', href: '/settings', description: 'General settings' },
        { name: 'Accounting', href: '/accounting', description: 'Financial management' },
      ]}
    />
  )
}



