import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | HDS',
  description:
    'Get in touch with HDS for product inquiries, technical support, enterprise orders, and partnership opportunities.',
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
