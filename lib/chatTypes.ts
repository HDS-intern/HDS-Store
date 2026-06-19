export type ChatChannel = 'bot' | 'support'
export type ChatSender = 'customer' | 'bot' | 'staff'

export interface ChatMessage {
  id: string
  userId: string
  channel: ChatChannel
  sender: ChatSender
  body: string
  createdAt: string
  readAt?: string
}

export interface ChatThreadSummary {
  userId: string
  customerName: string
  customerEmail: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}
