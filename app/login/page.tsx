'use client'

import { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useApp } from '@/lib/context'
import { LogIn } from 'lucide-react'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useApp()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      await login(loginId, password)
      const token = localStorage.getItem('hds_session_token')
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.user?.role === 'admin' || data.user?.role === 'staff') {
        router.push('/admin')
      } else {
        router.push('/account')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Log In</h1>
          <p className={styles.subtitle}>Welcome back to HDS</p>

          {error && <p className={styles.error}>{error}</p>}

          <form onSubmit={handleSubmit}>
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
            />

            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className={styles.forgotRow}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <LogIn className="w-5 h-5 inline mr-2" />
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className={styles.link}>
              Register
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
