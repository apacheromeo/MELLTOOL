import ComingSoon from '@/components/ComingSoon'

export default function BackupPage() {
  return (
    <ComingSoon
      title="Backup & Restore"
      titleTh="สำรองและกู้คืนข้อมูล"
      description="Backup your data and restore from previous backups"
      descriptionTh="สำรองข้อมูลและกู้คืนจากการสำรองก่อนหน้า"
      icon="💾"
      relatedLinks={[
        { name: 'Settings', href: '/settings', description: 'General settings' },
      ]}
    />
  )
}



