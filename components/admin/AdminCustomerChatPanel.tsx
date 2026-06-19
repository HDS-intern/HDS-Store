'use client'

import { useCallback, useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { ChatMessage, ChatThreadSummary } from '@/lib/chatTypes'
import styles from './AdminCustomerChatPanel.module.css'

type AdminCustomerChatPanelProps = {
  onError?: (message: string) => void
}

export function AdminCustomerChatPanel({ onError }: AdminCustomerChatPanelProps) {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadThreads = useCallback(async () => {
    try {
      const data = await apiFetch<{ threads: ChatThreadSummary[] }>('/api/admin/customer-chat')
      setThreads(data.threads)
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to load chats')
    }
  }, [onError])

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
            <button
              key={thread.userId}
              type="button"
              className={`${styles.threadBtn} ${
                selectedUserId === thread.userId ? styles.threadBtnActive : ''
              }`}
              onClick={() => setSelectedUserId(thread.userId)}
            >
              <span className={styles.threadName}>{thread.customerName}</span>
              <span className={styles.threadPreview}>{thread.lastMessage}</span>
              {thread.unreadCount > 0 && (
                <span className={styles.threadBadge}>{thread.unreadCount}</span>
              )}
            </button>
          ))}
        </aside>

        <section className={styles.conversation}>
          {!selectedUserId ? (
            <p className={styles.empty}>Select a conversation to reply.</p>
          ) : (
            <>
              <div className={styles.conversationHeader}>
                <div>
                  <p className={styles.customerName}>{selectedThread?.customerName}</p>
                  <p className={styles.customerEmail}>{selectedThread?.customerEmail}</p>
                </div>
              </div>

              <div className={styles.messages}>
                {messages.map((message) => (
                  <div
                    key={message.id}
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
                ))}
              </div>

              <div className={styles.composer}>
                <textarea
                  className={styles.input}
                  rows={2}
                  placeholder="Type your reply..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
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
    </div>
  )
}
