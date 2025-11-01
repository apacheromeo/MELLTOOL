import ComingSoon from '@/components/ComingSoon'

export default function NotificationsPage() {
  return (
    <ComingSoon
      title="Notifications"
      titleTh="การแจ้งเตือน"
      description="Configure notification preferences and alerts"
      descriptionTh="กำหนดค่าการแจ้งเตือนและการเตือนภัย"
      icon="🔔"
      relatedLinks={[
        { name: 'Settings', href: '/settings', description: 'General settings' },
        { name: 'Low Stock', href: '/inventory/low-stock', description: 'Stock alerts' },
      ]}
    />
  )
}



