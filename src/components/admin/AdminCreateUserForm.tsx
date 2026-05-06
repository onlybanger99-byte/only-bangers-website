'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type AppRole = 'customer' | 'barber' | 'admin'

export function AdminCreateUserForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<AppRole>('customer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<string[]>([])

  const sendInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    setErrorDetails([])

    const response = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        displayName,
        role,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details)
        ? payload.error.details.filter((detail: unknown): detail is string => typeof detail === 'string' && detail.trim().length > 0)
        : []
      const nextMessage =
        payload?.error?.message ??
        payload?.message ??
        payload?.error ??
        'Could not send this invite.'

      setError(nextMessage)
      setErrorDetails(details)
      setLoading(false)
      return
    }

    setEmail('')
    setDisplayName('')
    setRole('customer')
    setMessage(payload?.message ?? 'Invitation sent to email.')
    setLoading(false)
    router.refresh()
  }

  return (
    <form className={styles.formStack} onSubmit={sendInvite}>
      <p className={styles.cardSubmeta}>
        Send an account setup email so the user can complete their profile and set their own password.
      </p>

      <div className={styles.filtersGridCompactWide}>
        <input
          type="email"
          className={styles.input}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          required
        />
        <input
          className={styles.input}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Display name (optional)"
        />
        <select className={styles.input} value={role} onChange={(event) => setRole(event.target.value as AppRole)}>
          <option value="customer">Customer</option>
          <option value="barber">Barber</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? (
        <div className={styles.errorText}>
          <p>{error}</p>
          {errorDetails.length > 0 ? (
            <ul className={styles.errorList}>
              {errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
