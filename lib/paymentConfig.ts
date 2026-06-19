export const UPI_ID = 'hdsindia@oksbi'

export const COMPANY_NAME = 'HDS Private Limited'

export const BANK_DETAILS = {
  bankName: 'State Bank of India',
  accountName: 'HDS Private Limited',
  accountNumber: '41234567890',
  ifsc: 'SBIN0001234',
  branch: 'Thiruvallur, Tamil Nadu',
}

export const NET_BANKING_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
]

export function buildUpiPayLink(amount: number, orderNote?: string) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: COMPANY_NAME,
    cu: 'INR',
    am: amount.toFixed(2),
  })
  if (orderNote) params.set('tn', orderNote)
  return `upi://pay?${params.toString()}`
}
