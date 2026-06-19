import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Info | HDS',
  description:
    'HDS shipping methods, delivery times, international delivery, tracking, and shipping costs for drone orders.',
}

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children
}
