'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, Headphones, MessageCircle, Send, UserRound, X } from 'lucide-react'
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

function senderLabel(sender: ChatMessage['sender'], channel: ChatChannel) {
  if (sender === 'bot') return 'HDS AI Assistant'
  if (sender === 'staff') return 'Live Support'
  return channel === 'support' ? 'You' : 'You'
}

const LIVE_SUPPORT_HINT =
  'Need a real person? Switch to Live Support and our team will reply here.'

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

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff'
  const isGuest = !user
  const hiddenRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  const canUseChat = !authLoading && !isStaffOrAdmin && !hiddenRoute

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!canUseChat) return
      if (!silent) setLoading(true)
      try {
        const data = await apiFetch<{ messages: ChatMessage[]; unreadSupport: number }>(
          `/api/chat?channel=${channel}`
        )
        setMessages(data.messages)
        if (channel === 'support' && open) {
          setUnreadSupport(0)
        } else if (channel === 'bot') {
          setUnreadSupport(data.unreadSupport)
        }
      } catch {
        if (!silent) setMessages([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [canUseChat, channel, open]
  )

  const switchToLiveSupport = useCallback(() => {
    setChannel('support')
    setNotice(null)
    setUnreadSupport(0)
  }, [])

  useEffect(() => {
    if (!open || !canUseChat) return
    void loadMessages()
  }, [open, canUseChat, channel, loadMessages])

  useEffect(() => {
    if (!open || !canUseChat || channel !== 'support') return
    const timer = window.setInterval(() => {
      void loadMessages(true)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [open, canUseChat, channel, loadMessages])

  useEffect(() => {
    if (!open) return
    scrollToBottom()
  }, [messages, open, scrollToBottom])

  useEffect(() => {
    if (!canUseChat) return

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
  }, [canUseChat, open, channel])

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

      const wantsHuman = /live support|human|agent|real person|talk to someone/i.test(text)
      if (channel === 'bot' && wantsHuman) {
        setNotice('You can connect with our team using Live Support above.')
      }
    } catch {
      setNotice('Unable to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!canUseChat) return null

  const showBadge = unreadSupport > 0 && !open

  return (
    <div className={styles.customerChatWrap} aria-live="polite">
      {open && (
        <div className={styles.panel} role="dialog" aria-label="HDS chat assistant">
          <div className={styles.header}>
            <div>
              <h2 className={styles.headerTitle}>HDS Assistant</h2>
              <p className={styles.headerSub}>
                {channel === 'bot'
                  ? isGuest
                    ? 'AI help + live support — no login required'
                    : 'AI answers instantly, or chat with our team'
                  : 'Live support — our team replies here'}
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
              AI Assistant
            </button>
            <button
              type="button"
              className={channel === 'support' ? styles.tabActive : styles.tab}
              onClick={switchToLiveSupport}
            >
              <UserRound className="w-4 h-4" />
              Live Support
              {unreadSupport > 0 && channel !== 'support' && (
                <span className={styles.tabBadge}>{unreadSupport > 9 ? '9+' : unreadSupport}</span>
              )}
            </button>
          </div>

          {channel === 'bot' && (
            <div className={styles.liveSupportBanner}>
              <p className={styles.liveSupportText}>{LIVE_SUPPORT_HINT}</p>
              <button type="button" className={styles.liveSupportBtn} onClick={switchToLiveSupport}>
                <Headphones className="w-4 h-4" />
                Connect to Live Support
              </button>
            </div>
          )}

          <div className={styles.messages}>
            {loading && <p className={styles.notice}>Loading conversation...</p>}
            {!loading && messages.length === 0 && channel === 'support' && (
              <p className={styles.notice}>
                Send a message and our support team will respond shortly during business hours.
              </p>
            )}
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
                      {senderLabel(message.sender, channel)} · {formatTime(message.createdAt)}
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
                channel === 'bot'
                  ? 'Ask the AI about orders, shipping, warranty...'
                  : 'Message our live support team...'
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
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close chat' : 'Open HDS assistant'}
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
