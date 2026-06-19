'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, MessageCircle, Send, UserRound, X } from 'lucide-react'
import { useApp } from '@/lib/context'
import { apiFetch } from '@/lib/api'
import type { ChatChannel, ChatMessage } from '@/lib/chatTypes'
import styles from './CustomerChatWidget.module.css'

function formatBody(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function senderLabel(sender: ChatMessage['sender']) {
  if (sender === 'bot') return 'HDS Assistant'
  if (sender === 'staff') return 'Support Team'
  return 'You'
}

export function CustomerChatWidget() {
  const pathname = usePathname()
  const { user, authLoading } = useApp()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<ChatChannel>('bot')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unreadSupport, setUnreadSupport] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isCustomer = user?.role === 'customer'
  const hiddenRoute = pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register')

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadMessages = useCallback(async (silent = false) => {
    if (!isCustomer) return
    if (!silent) setLoading(true)
    try {
      const data = await apiFetch<{ messages: ChatMessage[]; unreadSupport: number }>(
        `/api/chat?channel=${channel}`
      )
      setMessages(data.messages)
      setUnreadSupport(data.unreadSupport)
      if (channel === 'support' && open) {
        setUnreadSupport(0)
      }
    } catch {
      if (!silent) setMessages([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [channel, isCustomer, open])

  useEffect(() => {
    if (!open || !isCustomer) return
    void loadMessages()
  }, [open, isCustomer, channel, loadMessages])

  useEffect(() => {
    if (!open || !isCustomer || channel !== 'support') return
    const timer = window.setInterval(() => {
      void loadMessages(true)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [open, isCustomer, channel, loadMessages])

  useEffect(() => {
    if (!open) return
    scrollToBottom()
  }, [messages, open, scrollToBottom])

  useEffect(() => {
    if (!isCustomer || hiddenRoute) return

    const pollUnread = async () => {
      try {
        const data = await apiFetch<{ unreadSupport: number }>(
          '/api/chat?channel=support&countOnly=1'
        )
        if (!open || channel !== 'support') {
          setUnreadSupport(data.unreadSupport)
        }
      } catch {
        // ignore polling errors
      }
    }

    void pollUnread()
    const timer = window.setInterval(pollUnread, 8000)
    return () => window.clearInterval(timer)
  }, [isCustomer, hiddenRoute, open, channel])

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || sending) return

    setSending(true)
    setNotice(null)
    try {
      const data = await apiFetch<{
        messages: ChatMessage[]
        notice?: string
      }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ channel, message: text }),
      })
      setMessages((prev) => [...prev, ...data.messages])
      setDraft('')
      if (data.notice) setNotice(data.notice)
    } catch {
      setNotice('Unable to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (authLoading || !isCustomer || hiddenRoute) return null

  const showBadge = unreadSupport > 0 && !open

  return (
    <div className={styles.customerChatWrap} aria-live="polite">
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Customer chat">
          <div className={styles.header}>
            <div>
              <h2 className={styles.headerTitle}>HDS Chat</h2>
              <p className={styles.headerSub}>
                {channel === 'bot' ? 'Instant answers from our assistant' : 'Chat with our support team'}
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={channel === 'bot' ? styles.tabActive : styles.tab}
              onClick={() => {
                setChannel('bot')
                setNotice(null)
              }}
            >
              <Bot className="w-4 h-4" />
              Chatbot
            </button>
            <button
              type="button"
              className={channel === 'support' ? styles.tabActive : styles.tab}
              onClick={() => {
                setChannel('support')
                setNotice(null)
                setUnreadSupport(0)
              }}
            >
              <UserRound className="w-4 h-4" />
              Live Support
            </button>
          </div>

          <div className={styles.messages}>
            {loading && <p className={styles.notice}>Loading conversation...</p>}
            {!loading &&
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageRow} ${
                    message.sender === 'customer'
                      ? styles.messageRowCustomer
                      : message.sender === 'staff'
                        ? styles.messageRowStaff
                        : styles.messageRowBot
                  }`}
                >
                  <div
                    className={`${styles.bubble} ${
                      message.sender === 'customer'
                        ? styles.bubbleCustomer
                        : message.sender === 'staff'
                          ? styles.bubbleStaff
                          : styles.bubbleBot
                    }`}
                  >
                    {formatBody(message.body)}
                    <span className={styles.meta}>
                      {senderLabel(message.sender)} · {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            {notice && <p className={styles.notice}>{notice}</p>}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.composer}>
            <textarea
              className={styles.input}
              rows={1}
              placeholder={
                channel === 'bot' ? 'Ask about orders, shipping, warranty...' : 'Message support team...'
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage()
                }
              }}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => void sendMessage()}
              disabled={sending || !draft.trim()}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ''}`}
        onClick={() => {
          setOpen((prev) => !prev)
          if (!open) setUnreadSupport(0)
        }}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        {!open && <span className={styles.launcherRing} aria-hidden="true" />}
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {showBadge && (
          <span className={styles.badge} aria-label={`${unreadSupport} unread support messages`}>
            {unreadSupport > 9 ? '9+' : unreadSupport}
          </span>
        )}
      </button>
    </div>
  )
}
