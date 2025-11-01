import ComingSoon from '@/components/ComingSoon'

export default function RolesPage() {
  return (
    <ComingSoon
      title="Roles & Permissions"
      titleTh="บทบาทและสิทธิ์"
      description="Configure user roles and their permissions"
      descriptionTh="กำหนดบทบาทผู้ใช้และสิทธิ์การเข้าถึง"
      icon="🔐"
      relatedLinks={[
        { name: 'User Management', href: '/settings/users', description: 'Manage users' },
        { name: 'Settings', href: '/settings', description: 'General settings' },
      ]}
    />
  )
}



