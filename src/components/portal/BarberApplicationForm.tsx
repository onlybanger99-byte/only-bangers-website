'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/portal/barber-application/barber-application.module.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type FormState = {
  cuttingLocation: string
  instagramUrl: string
  tiktokUrl: string
  facebookUrl: string
  portfolioUrl: string
  bio: string
  availableDays: string[]
  availableStartTime: string
  availableEndTime: string
  notes: string
}

export function BarberApplicationForm({
  initialValues,
}: {
  initialValues?: Partial<FormState>
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    cuttingLocation: initialValues?.cuttingLocation ?? '',
    instagramUrl: initialValues?.instagramUrl ?? '',
    tiktokUrl: initialValues?.tiktokUrl ?? '',
    facebookUrl: initialValues?.facebookUrl ?? '',
    portfolioUrl: initialValues?.portfolioUrl ?? '',
    bio: initialValues?.bio ?? '',
    availableDays: initialValues?.availableDays ?? [],
    availableStartTime: initialValues?.availableStartTime ?? '',
    availableEndTime: initialValues?.availableEndTime ?? '',
    notes: initialValues?.notes ?? '',
  })
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
    setError('')

    const response = await fetch('/api/barber-applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'We could not submit your application.')
      setSaving(false)
      return
    }

    router.push('/portal/dashboard?application=submitted')
    router.refresh()
  }

  return (
    <form className={styles.formShell} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Cutting Location</span>
          <input
            className={styles.input}
            value={form.cuttingLocation}
            onChange={(event) => setForm((current) => ({ ...current, cuttingLocation: event.target.value }))}
            placeholder="Area or full address"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Portfolio Link</span>
          <input
            className={styles.input}
            value={form.portfolioUrl}
            onChange={(event) => setForm((current) => ({ ...current, portfolioUrl: event.target.value }))}
            placeholder="https://..."
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Instagram</span>
          <input
            className={styles.input}
            value={form.instagramUrl}
            onChange={(event) => setForm((current) => ({ ...current, instagramUrl: event.target.value }))}
            placeholder="@handle or https://instagram.com/..."
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>TikTok</span>
          <input
            className={styles.input}
            value={form.tiktokUrl}
            onChange={(event) => setForm((current) => ({ ...current, tiktokUrl: event.target.value }))}
            placeholder="@handle or https://tiktok.com/..."
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Facebook</span>
          <input
            className={styles.input}
            value={form.facebookUrl}
            onChange={(event) => setForm((current) => ({ ...current, facebookUrl: event.target.value }))}
            placeholder="Profile URL or page handle"
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Available Days</span>
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
          <span className={styles.label}>Available Start Time</span>
          <input
            type="time"
            className={styles.input}
            value={form.availableStartTime}
            onChange={(event) => setForm((current) => ({ ...current, availableStartTime: event.target.value }))}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Available End Time</span>
          <input
            type="time"
            className={styles.input}
            value={form.availableEndTime}
            onChange={(event) => setForm((current) => ({ ...current, availableEndTime: event.target.value }))}
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Short Barber Bio</span>
        <textarea
          className={styles.textarea}
          value={form.bio}
          onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          rows={5}
          placeholder="Tell admin and future clients about your style, strengths, and experience."
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Optional Notes</span>
        <textarea
          className={styles.textarea}
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          rows={4}
          placeholder="Anything else admin should know about your setup or availability."
        />
      </label>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Barber Application'}
        </button>
      </div>
    </form>
  )
}
