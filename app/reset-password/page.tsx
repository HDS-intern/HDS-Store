'use client'

import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { LockKeyhole } from 'lucide-react'
import styles from '../login/page.module.css'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')

      setSuccess(data.message || 'Password updated successfully.')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Invalid Link</h1>
        <p className={styles.subtitle}>This password reset link is missing or invalid.</p>
        <p className={styles.footer}>
          <Link href="/forgot-password" className={styles.link}>
            Request a new reset link
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Reset Password</h1>
      <p className={styles.subtitle}>Choose a new password for your account.</p>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="password" className={styles.label}>
          New Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={4}
          className={styles.input}
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label htmlFor="confirmPassword" className={styles.label}>
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={4}
          className={styles.input}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" className={styles.submitBtn} disabled={loading || Boolean(success)}>
          <LockKeyhole className="w-5 h-5 inline mr-2" />
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Back to Log In
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.main}>
        <Suspense fallback={<div className={styles.card}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
