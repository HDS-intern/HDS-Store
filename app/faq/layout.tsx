import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | HDS',
  description:
    'Frequently asked questions about HDS drones, orders, shipping, warranty, and technical support.',
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
