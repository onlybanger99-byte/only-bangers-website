'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminBarberRow } from '@/lib/admin-dashboard/types'
import styles from '@/app/admin/dashboard/dashboard.module.css'

export function AdminBarberActions({
  barber,
}: {
  barber: AdminBarberRow
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    displayName: barber.displayName,
    specialty: barber.specialty,
    bio: barber.bio,
    cuttingLocation: barber.cuttingLocation,
    instagramUrl: barber.instagramUrl ?? '',
    tiktokUrl: barber.tiktokUrl ?? '',
    facebookUrl: barber.facebookUrl ?? '',
    portfolioUrl: barber.portfolioUrl ?? '',
    isActive: barber.activeStatus === 'active',
  })
  const [loadingAction, setLoadingAction] = useState<'save' | 'deactivate' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const runAction = async (
    action: 'deactivate' | 'approve_go_live' | 'reject_go_live',
    successText: string
  ) => {
    const rejectionReason =
      action === 'reject_go_live'
        ? window.prompt('Add a short rejection reason for this go-live request:') ?? ''
        : ''

    setLoadingAction(action === 'deactivate' ? 'deactivate' : 'save')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/barbers/${barber.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, rejectionReason }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not update this barber.')
      setLoadingAction(null)
      return
    }

    setMessage(successText)
    setLoadingAction(null)
    router.refresh()
  }

  const saveProfile = async () => {
    setLoadingAction('save')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/barbers/${barber.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not update this barber.')
      setLoadingAction(null)
      return
    }

    setMessage('Barber profile updated.')
    setLoadingAction(null)
    router.refresh()
  }

  const deactivateBarber = async () => {
    if (!window.confirm('Deactivate this barber profile?')) {
      return
    }

    setLoadingAction('deactivate')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/barbers/${barber.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'deactivate' }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not deactivate this barber.')
      setLoadingAction(null)
      return
    }

    setMessage('Barber deactivated.')
    setLoadingAction(null)
    router.refresh()
  }

  return (
    <div className={styles.actionStack}>
      <div className={styles.filtersGridCompact}>
        <input
          className={styles.input}
          value={form.displayName}
          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          placeholder="Display name"
        />
        <input
          className={styles.input}
          value={form.specialty}
          onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
          placeholder="Specialty"
        />
        <input
          className={styles.input}
          value={form.cuttingLocation}
          onChange={(event) => setForm((current) => ({ ...current, cuttingLocation: event.target.value }))}
          placeholder="Cutting location"
        />
      </div>
      <textarea
        className={styles.input}
        rows={3}
        value={form.bio}
        onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
        placeholder="Barber bio"
      />
      <div className={styles.filtersGridCompact}>
        <input
          className={styles.input}
          value={form.instagramUrl}
          onChange={(event) => setForm((current) => ({ ...current, instagramUrl: event.target.value }))}
          placeholder="Instagram"
        />
        <input
          className={styles.input}
          value={form.tiktokUrl}
          onChange={(event) => setForm((current) => ({ ...current, tiktokUrl: event.target.value }))}
          placeholder="TikTok"
        />
        <input
          className={styles.input}
          value={form.facebookUrl}
          onChange={(event) => setForm((current) => ({ ...current, facebookUrl: event.target.value }))}
          placeholder="Facebook"
        />
        <input
          className={styles.input}
          value={form.portfolioUrl}
          onChange={(event) => setForm((current) => ({ ...current, portfolioUrl: event.target.value }))}
          placeholder="Portfolio"
        />
      </div>
      <div className={styles.inlineActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={loadingAction !== null}
          onClick={saveProfile}
        >
          {loadingAction === 'save' ? 'Saving...' : 'Edit Barber Profile'}
        </button>
        {barber.setupStatus === 'pending_review' && !barber.isLive ? (
          <>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={loadingAction !== null}
              onClick={() => runAction('approve_go_live', 'Barber is now live to customers.')}
            >
              Approve Go-Live
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={loadingAction !== null}
              onClick={() => runAction('reject_go_live', 'Go-live request rejected.')}
            >
              Reject Go-Live
            </button>
          </>
        ) : null}
        {barber.activeStatus === 'active' ? (
          <button
            type="button"
            className={styles.dangerButton}
            disabled={loadingAction !== null}
            onClick={deactivateBarber}
          >
            {loadingAction === 'deactivate' ? 'Deactivating...' : 'Deactivate Barber'}
          </button>
        ) : null}
      </div>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
