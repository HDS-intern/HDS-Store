'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, MessageCircle, Send, Ticket, X } from 'lucide-react'
import { useApp } from '@/lib/context'
import { apiFetch } from '@/lib/api'
import { TICKET_SUBJECT_OPTIONS } from '@/lib/ticketSubjects'
import type { ChatMessage } from '@/lib/chatTypes'
import styles from './CustomerChatWidget.module.css'

type WidgetTab = 'bot' | 'ticket'

function formatBody(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TICKET_HINT =
  'Need help from our team? Open Ticket Generation and submit your request — we will respond within one business day.'

const emptyTicketForm = (name = '', email = '') => ({
  name,
  email,
  phone: '',
  subject: TICKET_SUBJECT_OPTIONS[0],
  message: '',
})

export function CustomerChatWidget() {
  const pathname = usePathname()
  const { user, authLoading } = useApp()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<WidgetTab>('bot')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [ticketForm, setTicketForm] = useState(emptyTicketForm())
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketSuccess, setTicketSuccess] = useState(false)
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

  const loadBotMessages = useCallback(async () => {
    if (!canUseChat) return
    setLoading(true)
    try {
      const data = await apiFetch<{ messages: ChatMessage[] }>('/api/chat?channel=bot')
      setMessages(data.messages)
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [canUseChat])

  const switchToTicketGeneration = useCallback(() => {
    setTab('ticket')
    setNotice(null)
    setTicketSuccess(false)
    setTicketForm((prev) => ({
      ...prev,
      name: user?.name?.replace(/\s+customer$/i, '').trim() || prev.name,
      email: user?.email || prev.email,
    }))
  }, [user?.email, user?.name])

  useEffect(() => {
    if (!open || !canUseChat || tab !== 'bot') return
    void loadBotMessages()
  }, [open, canUseChat, tab, loadBotMessages])

  useEffect(() => {
    if (!open) return
    if (tab === 'bot') scrollToBottom()
  }, [messages, open, tab, scrollToBottom])

  const sendBotMessage = async () => {
    const text = draft.trim()
    if (!text || sending || tab !== 'bot') return

    setSending(true)
    setNotice(null)
    try {
      const data = await apiFetch<{ messages: ChatMessage[] }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ channel: 'bot', message: text }),
      })
      setMessages((prev) => [...prev, ...data.messages])
      setDraft('')

      const wantsTicket = /ticket|support|human|agent|real person|contact team/i.test(text)
      if (wantsTicket) {
        setNotice('You can submit a support ticket using Ticket Generation above.')
      }
    } catch {
      setNotice('Unable to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const submitTicket = async () => {
    const name = ticketForm.name.trim()
    const email = ticketForm.email.trim()
    const message = ticketForm.message.trim()

    if (!name || !email || !message) {
      setNotice('Name, email, and message are required for ticket generation.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice('Please enter a valid email address.')
      return
    }

    if (message.length < 10) {
      setNotice('Message must be at least 10 characters.')
      return
    }

    setTicketSubmitting(true)
    setNotice(null)
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone: ticketForm.phone.trim() || undefined,
          subject: ticketForm.subject,
          message,
        }),
      })
      setTicketSuccess(true)
      setTicketForm(emptyTicketForm(user?.name?.replace(/\s+customer$/i, '').trim() || '', user?.email || ''))
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to generate ticket. Please try again.')
    } finally {
      setTicketSubmitting(false)
    }
  }

  if (!canUseChat) return null

  return (
    <div className={styles.customerChatWrap} aria-live="polite">
      {open && (
        <div className={styles.panel} role="dialog" aria-label="HDS chat assistant">
          <div className={styles.header}>
            <div>
              <h2 className={styles.headerTitle}>HDS Assistant</h2>
              <p className={styles.headerSub}>
                {tab === 'bot'
                  ? isGuest
                    ? 'AI help + ticket generation — no login required'
                    : 'AI answers instantly, or generate a support ticket'
                  : 'Submit a ticket — our team will respond within one business day'}
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
              className={tab === 'bot' ? styles.tabActive : styles.tab}
              onClick={() => {
                setTab('bot')
                setNotice(null)
              }}
            >
              <Bot className="w-4 h-4" />
              AI Assistant
            </button>
            <button
              type="button"
              className={tab === 'ticket' ? styles.tabActive : styles.tab}
              onClick={switchToTicketGeneration}
            >
              <Ticket className="w-4 h-4" />
              Ticket Generation
            </button>
          </div>

          {tab === 'bot' && (
            <div className={styles.ticketBanner}>
              <p className={styles.ticketBannerText}>{TICKET_HINT}</p>
              <button type="button" className={styles.ticketBannerBtn} onClick={switchToTicketGeneration}>
                <Ticket className="w-4 h-4" />
                Open Ticket Generation
              </button>
            </div>
          )}

          {tab === 'bot' ? (
            <>
              <div className={styles.messages}>
                {loading && <p className={styles.notice}>Loading conversation...</p>}
                {!loading &&
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.messageRow} ${
                        message.sender === 'customer'
                          ? styles.messageRowCustomer
                          : styles.messageRowBot
                      }`}
                    >
                      <div
                        className={`${styles.bubble} ${
                          message.sender === 'customer' ? styles.bubbleCustomer : styles.bubbleBot
                        }`}
                      >
                        {formatBody(message.body)}
                        <span className={styles.meta}>
                          {message.sender === 'customer' ? 'You' : 'HDS AI Assistant'} ·{' '}
                          {formatTime(message.createdAt)}
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
                  placeholder="Ask the AI about orders, shipping, warranty..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendBotMessage()
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => void sendBotMessage()}
                  disabled={sending || !draft.trim()}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.ticketPanel}>
              {ticketSuccess ? (
                <div className={styles.ticketSuccess}>
                  <p className={styles.ticketSuccessTitle}>Ticket generated successfully</p>
                  <p className={styles.ticketSuccessText}>
                    Thank you for reaching out. Our team will respond to your inquiry within one
                    business day.
                  </p>
                  <button
                    type="button"
                    className={styles.ticketBannerBtn}
                    onClick={() => {
                      setTicketSuccess(false)
                      switchToTicketGeneration()
                    }}
                  >
                    Generate another ticket
                  </button>
                </div>
              ) : (
                <form
                  className={styles.ticketForm}
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submitTicket()
                  }}
                >
                  <label className={styles.ticketField}>
                    <span>Full Name *</span>
                    <input
                      type="text"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </label>
                  <label className={styles.ticketField}>
                    <span>Email *</span>
                    <input
                      type="email"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <label className={styles.ticketField}>
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={ticketForm.phone}
                      onChange={(e) => setTicketForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 99401 99407"
                    />
                  </label>
                  <label className={styles.ticketField}>
                    <span>Subject *</span>
                    <select
                      className="hds-select"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
                    >
                      {TICKET_SUBJECT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.ticketField}>
                    <span>Message *</span>
                    <textarea
                      rows={4}
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Describe your issue or request..."
                      required
                    />
                  </label>
                  {notice && <p className={styles.ticketError}>{notice}</p>}
                  <button type="submit" className={styles.ticketSubmitBtn} disabled={ticketSubmitting}>
                    <Send className="w-4 h-4" />
                    {ticketSubmitting ? 'Submitting...' : 'Generate Ticket'}
                  </button>
                </form>
              )}
            </div>
          )}
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
      </button>
    </div>
  )
}
