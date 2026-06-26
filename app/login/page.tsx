'use client'

import { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PasswordField } from '@/components/PasswordField'
import { AdminSlideUp } from '@/components/admin/AdminSlideUp'
import { useApp } from '@/lib/context'
import { isAdminArea } from '@/lib/theme'
import { LogIn } from 'lucide-react'
import styles from './page.module.css'

function AdminSlide({
  active,
  delayMs,
  children,
  className,
}: {
  active: boolean
  delayMs: number
  children: React.ReactNode
  className?: string
}) {
  if (!active) return <>{children}</>
  return (
    <AdminSlideUp delayMs={delayMs} className={className}>
      {children}
    </AdminSlideUp>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useApp()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  useEffect(() => {
    setIsAdminLogin(isAdminArea('/login', window.location.search))
  }, [])

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' || user.role === 'staff' ? '/admin' : '/account')
    }
  }, [user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedInUser = await login(loginId, password)
      router.push(
        loggedInUser.role === 'admin' || loggedInUser.role === 'staff' ? '/admin' : '/account'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.page} ${isAdminLogin ? styles.adminPage : ''}`}>
      <AdminSlide active={isAdminLogin} delayMs={0}>
        <Header />
      </AdminSlide>

      <div className={styles.main}>
        <div className={styles.card}>
          <AdminSlide active={isAdminLogin} delayMs={120}>
            <h1 className={styles.title}>{isAdminLogin ? 'Admin Log In' : 'Log In'}</h1>
            <p className={styles.subtitle}>
              {isAdminLogin ? 'Sign in to HDS Control Center' : 'Welcome back to HDS'}
            </p>
          </AdminSlide>

          {error && (
            <AdminSlide active={isAdminLogin} delayMs={200}>
              <p className={styles.error}>{error}</p>
            </AdminSlide>
          )}

          <form onSubmit={handleSubmit}>
            <AdminSlide active={isAdminLogin} delayMs={260}>
              <label htmlFor="login" className={styles.label}>
                Username or Email
              </label>
              <input
                id="login"
                type="text"
                required
                className={styles.input}
                placeholder="your username or email"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoComplete="username"
              />
            </AdminSlide>

            <AdminSlide active={isAdminLogin} delayMs={340}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </AdminSlide>

            <AdminSlide active={isAdminLogin} delayMs={420}>
              <div className={styles.forgotRow}>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
            </AdminSlide>

            <AdminSlide active={isAdminLogin} delayMs={500}>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                <LogIn className="w-5 h-5 inline mr-2" />
                {loading ? 'Signing in...' : 'Log In'}
              </button>
            </AdminSlide>
          </form>

          {!isAdminLogin && (
            <p className={styles.footer}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className={styles.link}>
                Register
              </Link>
            </p>
          )}
        </div>
      </div>

      {!isAdminLogin && <Footer />}
    </div>
  )
}
