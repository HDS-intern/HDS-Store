'use client'

import { useCallback, useEffect, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { ChatMessage, ChatThreadSummary } from '@/lib/chatTypes'
import { CustomerDetailsModal } from '@/components/admin/CustomerDetailsModal'
import styles from './AdminCustomerChatPanel.module.css'

type AdminCustomerChatPanelProps = {
  onError?: (message: string) => void
  onUnreadCountChange?: (count: number) => void
}

export function AdminCustomerChatPanel({ onError, onUnreadCountChange }: AdminCustomerChatPanelProps) {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const loadThreads = useCallback(async () => {
    try {
      const data = await apiFetch<{ threads: ChatThreadSummary[]; unreadCount: number }>(
        '/api/admin/customer-chat'
      )
      setThreads(data.threads)
      onUnreadCountChange?.(data.unreadCount ?? 0)
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to load chats')
    }
  }, [onError, onUnreadCountChange])

  const loadConversation = useCallback(
    async (userId: string) => {
      try {
        const data = await apiFetch<{ messages: ChatMessage[] }>(
          `/api/admin/customer-chat?userId=${encodeURIComponent(userId)}`
        )
        setMessages(data.messages)
        await loadThreads()
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Failed to load conversation')
      }
    },
    [loadThreads, onError]
  )

  useEffect(() => {
    setLoading(true)
    void loadThreads().finally(() => setLoading(false))
  }, [loadThreads])

  useEffect(() => {
    if (!selectedUserId) return
    void loadConversation(selectedUserId)
    const timer = window.setInterval(() => {
      void loadConversation(selectedUserId)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [selectedUserId, loadConversation])

  useEffect(() => {
    setProfileOpen(false)
  }, [selectedUserId])

  const sendReply = async () => {
    if (!selectedUserId || !draft.trim() || sending) return
    setSending(true)
    try {
      const data = await apiFetch<{ message: ChatMessage }>('/api/admin/customer-chat', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId, message: draft.trim() }),
      })
      setMessages((prev) => [...prev, data.message])
      setDraft('')
      await loadThreads()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (deletingMessageId || deletingThreadId) return
    if (!window.confirm('Delete this message?')) return

    setDeletingMessageId(messageId)
    try {
      const data = await apiFetch<{ unreadCount: number }>('/api/admin/customer-chat', {
        method: 'DELETE',
        body: JSON.stringify({ messageId }),
      })
      setMessages((prev) => prev.filter((message) => message.id !== messageId))
      onUnreadCountChange?.(data.unreadCount ?? 0)
      await loadThreads()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to delete message')
    } finally {
      setDeletingMessageId(null)
    }
  }

  const deleteThread = async (userId: string, customerName: string) => {
    if (deletingMessageId || deletingThreadId) return
    if (!window.confirm(`Delete the entire chat with ${customerName}?`)) return

    setDeletingThreadId(userId)
    try {
      const data = await apiFetch<{ unreadCount: number }>('/api/admin/customer-chat', {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      })
      setThreads((prev) => prev.filter((thread) => thread.userId !== userId))
      if (selectedUserId === userId) {
        setSelectedUserId(null)
        setMessages([])
        setProfileOpen(false)
      }
      onUnreadCountChange?.(data.unreadCount ?? 0)
      await loadThreads()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to delete conversation')
    } finally {
      setDeletingThreadId(null)
    }
  }

  const selectedThread = threads.find((thread) => thread.userId === selectedUserId)

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Customer Live Chat</h1>
      <p className={styles.subtitle}>
        Reply to customer messages from the floating chat widget on the store.
      </p>

      <div className={styles.layout}>
        <aside className={styles.threadList}>
          <p className={styles.listTitle}>Conversations</p>
          {loading && <p className={styles.empty}>Loading...</p>}
          {!loading && threads.length === 0 && (
            <p className={styles.empty}>No live support chats yet.</p>
          )}
          {threads.map((thread) => (
            <div
              key={thread.userId}
              className={`${styles.threadRow} ${
                selectedUserId === thread.userId ? styles.threadRowActive : ''
              }`}
            >
              <button
                type="button"
                className={styles.threadBtn}
                onClick={() => setSelectedUserId(thread.userId)}
              >
                <span className={styles.threadName}>{thread.customerName}</span>
                <span className={styles.threadPreview}>{thread.lastMessage}</span>
                {thread.unreadCount > 0 && (
                  <span className={styles.threadBadge}>{thread.unreadCount}</span>
                )}
              </button>
              <button
                type="button"
                className={styles.threadDeleteBtn}
                onClick={() => void deleteThread(thread.userId, thread.customerName)}
                disabled={deletingThreadId === thread.userId}
                aria-label={`Delete chat with ${thread.customerName}`}
                title="Delete conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </aside>

        <section className={styles.conversation}>
          {!selectedUserId ? (
            <p className={styles.empty}>Select a conversation to reply.</p>
          ) : (
            <>
              <div className={styles.conversationHeader}>
                <div>
                  <button
                    type="button"
                    className={styles.customerNameBtn}
                    onClick={() => setProfileOpen(true)}
                  >
                    {selectedThread?.customerName}
                  </button>
                  <p className={styles.customerEmail}>{selectedThread?.customerEmail}</p>
                </div>
              </div>

              <div className={styles.messages}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.messageWrap} ${
                      message.sender === 'customer'
                        ? styles.messageWrapCustomer
                        : styles.messageWrapStaff
                    }`}
                  >
                    <div
                      className={`${styles.message} ${
                        message.sender === 'customer' ? styles.messageCustomer : styles.messageStaff
                      }`}
                    >
                      <p className={styles.messageBody}>{message.body}</p>
                      <span className={styles.messageMeta}>
                        {message.sender === 'customer' ? 'Customer' : 'You'} ·{' '}
                        {new Date(message.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => void deleteMessage(message.id)}
                      disabled={deletingMessageId === message.id}
                      aria-label="Delete message"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.composer}>
                <textarea
                  className={styles.input}
                  rows={2}
                  placeholder="Type your reply..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendReply()
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => void sendReply()}
                  disabled={sending || !draft.trim()}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {profileOpen && selectedUserId && (
        <CustomerDetailsModal
          userId={selectedUserId}
          displayName={selectedThread?.customerName}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  )
}
