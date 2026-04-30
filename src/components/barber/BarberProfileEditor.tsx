'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BarberOperatorProfile } from '@/lib/barber-dashboard/types'
import styles from '@/app/barber/dashboard/dashboard.module.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function BarberProfileEditor({
  profile,
}: {
  profile: BarberOperatorProfile
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    displayName: profile.displayName,
    cuttingLocation: profile.cuttingLocation ?? '',
    instagramUrl: profile.instagramUrl ?? '',
    tiktokUrl: profile.tiktokUrl ?? '',
    facebookUrl: profile.facebookUrl ?? '',
    portfolioUrl: profile.portfolioUrl ?? '',
    bio: profile.bio,
    availableDays: profile.availableDays,
    availableStartTime: profile.availableStartTime ?? '',
    availableEndTime: profile.availableEndTime ?? '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleDay = (day: string) => {
    setForm((current) => ({
      ...current,
      availableDays: current.availableDays.includes(day)
        ? current.availableDays.filter((item) => item !== day)
        : [...current.availableDays, day],
    }))
  }

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
        <label className={styles.field}>
          <span className={styles.metaLabel}>Start Time</span>
          <input
            type="time"
            className={styles.input}
            value={form.availableStartTime}
            onChange={(event) => setForm((current) => ({ ...current, availableStartTime: event.target.value }))}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>End Time</span>
          <input
            type="time"
            className={styles.input}
            value={form.availableEndTime}
            onChange={(event) => setForm((current) => ({ ...current, availableEndTime: event.target.value }))}
            required
          />
        </label>
      </div>

      <div className={styles.field}>
        <span className={styles.metaLabel}>Available Days</span>
        <div className={styles.dayGrid}>
          {DAYS.map((day) => (
            <label key={day} className={styles.dayOption}>
              <input
                type="checkbox"
                checked={form.availableDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <span>{day}</span>
            </label>
          ))}
        </div>
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
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </form>
  )
}
