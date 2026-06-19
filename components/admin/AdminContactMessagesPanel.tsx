'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { ContactMessage } from '@/lib/contactMessages'
import styles from './AdminContactMessagesPanel.module.css'

function formatMessageDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatContactName(name: string) {
  return name.replace(/\s+customer$/i, '').trim() || name
}

function buildReplyMailto(item: ContactMessage) {
  const subject = encodeURIComponent(`Re: ${item.subject}`)
  const body = encodeURIComponent(
    `Hi ${formatContactName(item.name)},\n\nThank you for contacting Hawking Defence.\n\nRegarding your message:\n"${item.message}"\n\n`
  )
  return `mailto:${item.email}?subject=${subject}&body=${body}`
}

export function AdminContactMessagesPanel({
  onMessagesRead,
  onUnreadCountChange,
}: {
  onMessagesRead?: () => void
  onUnreadCountChange?: (count: number) => void
}) {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null)

  const syncUnreadCount = useCallback(
    (count: number) => {
      onUnreadCountChange?.(count)
      if (count === 0) onMessagesRead?.()
    },
    [onMessagesRead, onUnreadCountChange]
  )

  const loadMessages = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const data = await apiFetch<{ messages: ContactMessage[]; unreadCount: number }>(
        '/api/admin/contact-messages'
      )
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      syncUnreadCount(data.unreadCount ?? 0)
    } catch {
      setMessages([])
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [syncUnreadCount])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return
    setDeletingId(id)
    try {
      const data = await apiFetch<{ unreadCount: number }>('/api/admin/contact-messages', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      })
      setMessages((prev) => prev.filter((item) => item.id !== id))
      if (viewMessage?.id === id) setViewMessage(null)
      syncUnreadCount(data.unreadCount ?? 0)
    } catch {
      window.alert('Failed to delete message')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadMessages(true)
  }, [loadMessages])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadMessages(false)
    }, 10000)

    return () => window.clearInterval(interval)
  }, [loadMessages])

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Send Us a Message</h1>
          <p className={styles.pageDesc}>
            Customer inquiries submitted from the contact page. Refreshes every 10 seconds.
          </p>
        </div>
        <button type="button" className={styles.refreshBtn} onClick={() => loadMessages(true)}>
          <RefreshCw className={`w-4 h-4 ${loading ? styles.spinning : ''}`} />
          Refresh
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Received</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((item) => (
              <tr key={item.id}>
                <td>{item.read ? 'Read' : 'New'}</td>
                <td>{formatContactName(item.name)}</td>
                <td>
                  <a
                    href={buildReplyMailto(item)}
                    className={styles.emailBtn}
                    title={`Email ${formatContactName(item.name)}`}
                  >
                    {item.email}
                  </a>
                </td>
                <td>{item.phone || '—'}</td>
                <td>{item.subject}</td>
                <td className={styles.messageCell}>
                  {item.message.length > 120 ? (
                    <>
                      {item.message.slice(0, 120)}…{' '}
                      <button
                        type="button"
                        className={styles.viewBtn}
                        onClick={() => setViewMessage(item)}
                      >
                        View full
                      </button>
                    </>
                  ) : (
                    item.message
                  )}
                </td>
                <td>{formatMessageDate(item.createdAt)}</td>
                <td>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    aria-label={`Delete message from ${item.name}`}
                  >
                    {deletingId === item.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && messages.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  No messages yet. Submissions from the customer contact form will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewMessage && (
        <div
          className={styles.backdrop}
          role="dialog"
          aria-modal="true"
          onClick={() => setViewMessage(null)}
        >
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.popupTitle}>{viewMessage.subject}</h2>
            <p className={styles.popupMeta}>{viewMessage.id}</p>
            <p className={styles.detailLine}>
              <strong>From:</strong> {formatContactName(viewMessage.name)} ·{' '}
              <a href={buildReplyMailto(viewMessage)} className={styles.emailBtn}>
                {viewMessage.email}
              </a>
            </p>
            {viewMessage.phone && (
              <p className={styles.detailLine}>
                <strong>Phone:</strong> {viewMessage.phone}
              </p>
            )}
            <p className={styles.detailLine}>
              <strong>Received:</strong> {formatMessageDate(viewMessage.createdAt)}
            </p>
            <div className={styles.messageBody}>{viewMessage.message}</div>
            <button type="button" className={styles.closeBtn} onClick={() => setViewMessage(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
