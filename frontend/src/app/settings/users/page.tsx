import ComingSoon from '@/components/ComingSoon'

export default function UsersPage() {
  return (
    <ComingSoon
      title="User Management"
      titleTh="จัดการผู้ใช้"
      description="Manage system users and their access"
      descriptionTh="จัดการผู้ใช้ระบบและสิทธิ์การเข้าถึง"
      icon="👥"
      relatedLinks={[
        { name: 'Settings', href: '/settings', description: 'General settings' },
        { name: 'Roles & Permissions', href: '/settings/roles', description: 'Manage roles' },
      ]}
    />
  )
}



