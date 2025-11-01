import ComingSoon from '@/components/ComingSoon'

export default function ShopeePage() {
  return (
    <ComingSoon
      title="Shopee Integration"
      titleTh="เชื่อมต่อ Shopee"
      description="Connect and manage Shopee shop integration"
      descriptionTh="เชื่อมต่อและจัดการการผสานรวมร้านค้า Shopee"
      icon="🛍️"
      relatedLinks={[
        { name: 'Settings', href: '/settings', description: 'General settings' },
        { name: 'Inventory', href: '/inventory', description: 'Manage products' },
      ]}
    />
  )
}



