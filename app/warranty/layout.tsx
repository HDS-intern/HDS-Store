import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Warranty | HDS',
  description:
    'HDS drone warranty coverage, claim process, exclusions, and extended warranty options for professional and military-grade systems.',
}

export default function WarrantyLayout({ children }: { children: React.ReactNode }) {
  return children
}
