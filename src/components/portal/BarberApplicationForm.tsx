'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AvailabilitySlotInput } from '@/lib/barber-availability/types'
import styles from '@/app/portal/barber-application/barber-application.module.css'

type FormState = {
  cuttingLocation: string
  instagramUrl: string
  tiktokUrl: string
  facebookUrl: string
  portfolioUrl: string
  bio: string
  availabilitySlots: AvailabilitySlotInput[]
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
    availabilitySlots: initialValues?.availabilitySlots ?? [],
    notes: initialValues?.notes ?? '',
  })
  const [slotDraft, setSlotDraft] = useState<AvailabilitySlotInput>({
    availableDate: '',
    startTime: '',
    endTime: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const addSlot = () => {
    if (!slotDraft.availableDate || !slotDraft.startTime || !slotDraft.endTime) {
      setError('Add a valid date, start time, and end time before saving an availability slot.')
      return
    }

    if (slotDraft.startTime >= slotDraft.endTime) {
      setError('End time must be after the start time.')
      return
    }

    setError('')
    setForm((current) => ({
      ...current,
      availabilitySlots: [...current.availabilitySlots, slotDraft].sort((left, right) => {
        const leftKey = `${left.availableDate}T${left.startTime}`
        const rightKey = `${right.availableDate}T${right.startTime}`
        return leftKey.localeCompare(rightKey)
      }),
    }))
    setSlotDraft({
      availableDate: '',
      startTime: '',
      endTime: '',
    })
  }

  const removeSlot = (index: number) => {
    setForm((current) => ({
      ...current,
      availabilitySlots: current.availabilitySlots.filter((_, currentIndex) => currentIndex !== index),
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

        <label className={styles.field}>
          <span className={styles.label}>Availability Slot Date</span>
          <input
            type="date"
            className={styles.input}
            value={slotDraft.availableDate}
            onChange={(event) =>
              setSlotDraft((current) => ({ ...current, availableDate: event.target.value }))
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Availability Slot Start</span>
          <input
            type="time"
            className={styles.input}
            value={slotDraft.startTime}
            onChange={(event) =>
              setSlotDraft((current) => ({ ...current, startTime: event.target.value }))
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Availability Slot End</span>
          <input
            type="time"
            className={styles.input}
            value={slotDraft.endTime}
            onChange={(event) =>
              setSlotDraft((current) => ({ ...current, endTime: event.target.value }))
            }
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Add Slot</span>
          <button type="button" className={styles.primaryButton} onClick={addSlot}>
            Add Availability Slot
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Selected Availability Slots</span>
        <div className={styles.dayGrid}>
          {form.availabilitySlots.length > 0 ? (
            form.availabilitySlots.map((slot, index) => (
              <div key={`${slot.availableDate}-${slot.startTime}-${slot.endTime}-${index}`} className={styles.dayOption}>
                <span>
                  {slot.availableDate} | {slot.startTime} - {slot.endTime}
                </span>
                <button type="button" className={styles.removeButton} onClick={() => removeSlot(index)}>
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className={styles.dayOption}>
              <span>No availability slots added yet.</span>
            </div>
          )}
        </div>
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
          placeholder="Anything else admin should know about your setup."
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
