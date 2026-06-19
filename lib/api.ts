const TOKEN_KEY = 'hds_session_token'
const GUEST_CHAT_KEY = 'hds_guest_chat_id'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getGuestChatId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(GUEST_CHAT_KEY)
  if (!id) {
    id = `guest-${crypto.randomUUID()}`
    localStorage.setItem(GUEST_CHAT_KEY, id)
  }
  return id
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  } else {
    const guestId = getGuestChatId()
    if (guestId) {
      ;(headers as Record<string, string>)['x-guest-chat-id'] = guestId
    }
  }

  const res = await fetch(url, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}
