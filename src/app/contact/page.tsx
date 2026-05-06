'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from './contact.module.css'

export default function ContactPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [form, setForm] = useState({
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) {
        return
      }

      if (!data.user?.email) {
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)
      setUserEmail(data.user.email)

      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('full_name, first_name')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!active) {
        return
      }

      setUserName(profile?.full_name || profile?.first_name || '')
    })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isAuthenticated) {
      setError('Please log in to send us a message.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/contact-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'We could not send your message.')
      setLoading(false)
      return
    }

    setSuccess('Message sent. The team will review it from admin pending actions.')
    setForm({
      subject: '',
      message: '',
    })
    setLoading(false)
  }

  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">Message the Only Bangers team directly from your account.</p>
        </div>

        <div className={styles.contactGrid}>
          <article className={styles.contactCard}>
            <h2 className={styles.cardTitle}>Reach Out</h2>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Support email</span>
                <span className={styles.contactValue}>support@onlybangers.co.za</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Support line</span>
                <span className={styles.contactValue}>+27 66 159 1976</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Booking flow</span>
                <span className={styles.contactValue}>Choose a barber, pick an open slot, then confirm on WhatsApp.</span>
              </div>
            </div>
          </article>

          <article className={styles.contactCard}>
            <h2 className={styles.cardTitle}>Send a Message</h2>
            {success ? <p className={styles.successMessage}>{success}</p> : null}
            {error ? <p className={styles.errorMessage}>{error}</p> : null}

            {isAuthenticated === false ? (
              <div className={styles.lockedState}>
                <p className={styles.lockedTitle}>Please log in to send us a message.</p>
                <Link href="/login" className={styles.submitButton}>
                  Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.contactForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Logged-in account</label>
                  <input
                    className={styles.formInput}
                    value={userName ? `${userName} · ${userEmail}` : userEmail}
                    readOnly
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    placeholder="Booking help, payment question, feedback..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message</label>
                  <textarea
                    rows={5}
                    className={styles.formInput}
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Tell us what you need help with."
                    required
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading || isAuthenticated === null}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
