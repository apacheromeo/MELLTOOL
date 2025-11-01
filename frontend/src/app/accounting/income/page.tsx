import ComingSoon from '@/components/ComingSoon'

export default function IncomePage() {
  return (
    <ComingSoon
      title="Income Management"
      titleTh="จัดการรายได้"
      description="Track and manage all income sources"
      descriptionTh="ติดตามและจัดการแหล่งรายได้ทั้งหมด"
      icon="💰"
      relatedLinks={[
        { name: 'Dashboard', href: '/accounting', description: 'Accounting overview' },
        { name: 'Expenses', href: '/accounting/expenses', description: 'View expenses' },
      ]}
    />
  )
}



