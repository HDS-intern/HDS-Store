let entranceStarted = false
let entranceSessionId = 0
let completedSessionId = 0

/** Start the admin dashboard entrance animation once per full page load. */
export function startAdminEntranceOnce(): number {
  if (entranceStarted) return 0
  entranceStarted = true
  entranceSessionId += 1
  return entranceSessionId
}

export function shouldRunAdminEntrance(sessionId: number): boolean {
  return sessionId > 0 && sessionId === entranceSessionId && completedSessionId !== sessionId
}

export function completeAdminEntrance(sessionId: number) {
  if (sessionId === entranceSessionId) {
    completedSessionId = sessionId
  }
}

export function wasAdminEntranceStarted(): boolean {
  return entranceStarted
}
