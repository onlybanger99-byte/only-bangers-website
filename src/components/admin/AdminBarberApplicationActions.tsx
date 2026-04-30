'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/admin/dashboard/dashboard.module.css'

export function AdminBarberApplicationActions({
  applicationId,
}: {
  applicationId: string
}) {
  const router = useRouter()
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const approve = async () => {
    if (!window.confirm('Approve this barber application and promote the user to barber?')) {
      return
    }

    setLoading('approve')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/barber-applications/${applicationId}/approve`, {
      method: 'POST',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not approve this application.')
      setLoading(null)
      return
    }

    setMessage('Application approved.')
    setLoading(null)
    router.refresh()
  }

  const reject = async () => {
    if (!rejectionReason.trim()) {
      setError('Add a rejection reason before rejecting this application.')
      return
    }

    setLoading('reject')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/barber-applications/${applicationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rejectionReason }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not reject this application.')
      setLoading(null)
      return
    }

    setMessage('Application rejected.')
    setLoading(null)
    router.refresh()
  }

  return (
    <div className={styles.actionStack}>
      <label className={styles.field}>
        <span className={styles.metaLabel}>Rejection reason</span>
        <textarea
          className={styles.input}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          rows={3}
          placeholder="Add a short reason if this application is not ready."
        />
      </label>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} onClick={approve} disabled={loading !== null}>
          {loading === 'approve' ? 'Approving...' : 'Approve'}
        </button>
        <button type="button" className={styles.dangerButton} onClick={reject} disabled={loading !== null}>
          {loading === 'reject' ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
