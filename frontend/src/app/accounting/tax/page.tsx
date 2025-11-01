import ComingSoon from '@/components/ComingSoon'

export default function TaxPage() {
  return (
    <ComingSoon
      title="Tax Reports"
      titleTh="รายงานภาษี"
      description="Generate tax reports and VAT calculations"
      descriptionTh="สร้างรายงานภาษีและคำนวณภาษีมูลค่าเพิ่ม"
      icon="📄"
      relatedLinks={[
        { name: 'Dashboard', href: '/accounting', description: 'Accounting overview' },
        { name: 'Financial Reports', href: '/accounting/reports', description: 'All reports' },
      ]}
    />
  )
}



