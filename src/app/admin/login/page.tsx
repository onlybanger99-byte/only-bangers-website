'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Simple admin authentication (for demo purposes)
      // In production, this should be done server-side with proper security
      if (email === 'admin@onlybangers.co.za' && password === 'admin123') {
        const adminData = {
          id: 'admin-001',
          email: email,
          name: 'Admin User',
          role: 'admin',
          loginTime: new Date().toISOString()
        }
        
        localStorage.setItem('onlyBangersAdmin', JSON.stringify(adminData))
        router.push('/admin/dashboard')
      } else {
        setError('Invalid email or password. Try admin@onlybangers.co.za / admin123')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Admin Portal</h1>
            <p className={styles.subtitle}>Only Bangers Management</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorAlert} role="alert">
                <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@onlybangers.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
                aria-label="Email address"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
                aria-label="Password"
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={isLoading}
              aria-label="Sign in to admin panel"
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Signing in...
                </>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>Demo Credentials</span>
          </div>

          <div className={styles.credentialsBox}>
            <p className={styles.credentialItem}>
              <strong>Email:</strong> admin@onlybangers.co.za
            </p>
            <p className={styles.credentialItem}>
              <strong>Password:</strong> admin123
            </p>
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              For security purposes, change your password after first login.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
