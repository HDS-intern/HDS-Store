const GREETING =
  'Hello! I am the HDS AI assistant. Ask me about products, orders, shipping, warranty, or returns. For a real person, tap **Live Support** or **Connect to Live Support** above.'

const FALLBACK =
  'I can help with orders, shipping, warranty, returns, payments, and contact details. For personal help, switch to **Live Support** in this chat and our team will reply here. You can also email info@hds-india.com or call +91-99401-99407.'

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
      'Use the **Bulk Order Sheet** page to upload a template with model numbers and quantities. Our team will confirm stock and pricing.',
  },
  {
    keywords: ['live support', 'live chat', 'talk to', 'speak to', 'representative'],
    reply:
      'Tap **Connect to Live Support** above, or switch to the **Live Support** tab. Our team will reply in this same chat window.',
  },
  {
    keywords: ['contact', 'phone', 'email', 'call', 'support', 'human', 'agent', 'live'],
    reply:
      'Reach HDS at **info@hds-india.com** or **+91-99401-99407**. For live help, tap **Live Support** at the top of this chat — our team will reply right here.',
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
