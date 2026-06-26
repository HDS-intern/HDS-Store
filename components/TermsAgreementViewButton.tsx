'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { TermsAgreementViewModal } from '@/components/admin/TermsAgreementViewModal'

type TermsAgreementViewButtonProps = {
  className?: string
  label?: string
  onError?: (message: string) => void
}

export function TermsAgreementViewButton({
  className = '',
  label = 'View Terms & Agreement',
  onError,
}: TermsAgreementViewButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Eye className="w-4 h-4" />
        {label}
      </button>
      {open && (
        <TermsAgreementViewModal
          previewUrl="/api/terms-agreement/preview"
          onClose={() => setOpen(false)}
          onError={onError}
        />
      )}
    </>
  )
}
