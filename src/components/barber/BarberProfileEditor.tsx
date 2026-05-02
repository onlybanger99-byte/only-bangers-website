'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BarberOperatorProfile } from '@/lib/barber-dashboard/types'
import styles from '@/app/barber/dashboard/dashboard.module.css'

export function BarberProfileEditor({
  profile,
}: {
  profile: BarberOperatorProfile
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    displayName: profile.displayName,
    cuttingLocation: profile.cuttingLocation ?? '',
    mapUrl: profile.mapUrl ?? '',
    instagramUrl: profile.instagramUrl ?? '',
    tiktokUrl: profile.tiktokUrl ?? '',
    facebookUrl: profile.facebookUrl ?? '',
    portfolioUrl: profile.portfolioUrl ?? '',
    bio: profile.bio,
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [requestingGoLive, setRequestingGoLive] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/barber/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not update profile.')
      setSaving(false)
      return
    }

    setMessage('Profile updated.')
    setSaving(false)
    router.refresh()
  }

  return (
    <form className={styles.formStack} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Display Name</span>
          <input
            className={styles.input}
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Cutting Location</span>
          <input
            className={styles.input}
            value={form.cuttingLocation}
            onChange={(event) => setForm((current) => ({ ...current, cuttingLocation: event.target.value }))}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Map URL</span>
          <input
            className={styles.input}
            value={form.mapUrl}
            onChange={(event) => setForm((current) => ({ ...current, mapUrl: event.target.value }))}
            placeholder="https://maps.google.com/..."
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Instagram</span>
          <input
            className={styles.input}
            value={form.instagramUrl}
            onChange={(event) => setForm((current) => ({ ...current, instagramUrl: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>TikTok</span>
          <input
            className={styles.input}
            value={form.tiktokUrl}
            onChange={(event) => setForm((current) => ({ ...current, tiktokUrl: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Facebook</span>
          <input
            className={styles.input}
            value={form.facebookUrl}
            onChange={(event) => setForm((current) => ({ ...current, facebookUrl: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Portfolio</span>
          <input
            className={styles.input}
            value={form.portfolioUrl}
            onChange={(event) => setForm((current) => ({ ...current, portfolioUrl: event.target.value }))}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.metaLabel}>Bio</span>
        <textarea
          className={styles.textarea}
          value={form.bio}
          onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          rows={5}
          required
        />
      </label>

      <div className={styles.inlineActions}>
        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={requestingGoLive}
          onClick={async () => {
            setRequestingGoLive(true)
            setMessage('')
            setError('')

            const response = await fetch('/api/barber/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'request_go_live' }),
            })
            const payload = await response.json().catch(() => null)

            if (!response.ok || !payload?.ok) {
              const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
              setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not submit go-live request.')
              setRequestingGoLive(false)
              return
            }

            setMessage('Go-live request submitted for admin review.')
            setRequestingGoLive(false)
            router.refresh()
          }}
        >
          {requestingGoLive ? 'Submitting...' : 'Submit Go-Live Request'}
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </form>
  )
}
