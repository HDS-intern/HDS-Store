const GREETING =
  'Hello! I am the HDS AI assistant. Ask me about products, orders, shipping, warranty, or returns. For help from our team, tap **Ticket Generation** or **Open Ticket Generation** above.'

const FALLBACK =
  'I can help with orders, shipping, warranty, returns, payments, and contact details. For personal help, switch to **Ticket Generation** in this chat and submit a support ticket. You can also email info@hds-india.com or call +91-99401-99407.'

type BotRule = {
  keywords: string[]
  reply: string
}

const RULES: BotRule[] = [
  {
    keywords: ['order', 'track', 'delivery', 'status'],
    reply:
      'Track orders from **My Account → Orders**. Open an order and use **Track Order** for live status updates. New orders appear after checkout is complete.',
  },
  {
    keywords: ['ship', 'shipping', 'deliver', 'courier'],
    reply:
      'We ship across India. Delivery timelines are shown on each product page and at checkout. See our Shipping page for full policy details.',
  },
  {
    keywords: ['warranty', 'claim', 'repair', 'defect'],
    reply:
      'Warranty coverage varies by product. Visit the **Warranty** page or open a paid order in your account to start a warranty request with your order details.',
  },
  {
    keywords: ['return', 'refund', 'cancel'],
    reply:
      'Returns can be requested from **My Account → Orders** on eligible delivered items. Refunds follow our returns policy after inspection.',
  },
  {
    keywords: ['pay', 'payment', 'upi', 'cod', 'netbank'],
    reply:
      'We accept UPI, net banking, card/bank transfer, and cash on delivery (where available). Payment options are shown at checkout.',
  },
  {
    keywords: ['bulk', 'sheet', 'wholesale'],
    reply:
      'Use the **Bulk Order Sheet** page to upload a template with SKU IDs and quantities. Our team will confirm stock and pricing.',
  },
  {
    keywords: ['ticket', 'support ticket', 'live chat', 'talk to', 'speak to', 'representative'],
    reply:
      'Tap **Open Ticket Generation** above, or switch to the **Ticket Generation** tab to submit a support request. Our team will respond within one business day.',
  },
  {
    keywords: ['contact', 'phone', 'email', 'call', 'support', 'human', 'agent', 'live'],
    reply:
      'Reach HDS at **info@hds-india.com** or **+91-99401-99407**. For help from our team, use **Ticket Generation** at the top of this chat to submit a support ticket.',
  },
  {
    keywords: ['address', 'location', 'office'],
    reply:
      'HDS Private Limited, No.45 JN Road, Kamarajapuram, Thiruvallur, TN - 602001.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help'],
    reply: GREETING,
  },
]

export function getBotGreeting(): string {
  return GREETING
}

export function getBotReply(message: string): string {
  const text = message.trim().toLowerCase()
  if (!text) return 'Please type a message so I can assist you.'

  for (const rule of RULES) {
    if (rule.keywords.some((word) => text.includes(word))) {
      return rule.reply
    }
  }

  return FALLBACK
}
