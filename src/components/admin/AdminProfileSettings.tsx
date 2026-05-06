'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminProfileSummary } from '@/lib/admin-dashboard/types'
import styles from '@/app/admin/dashboard/dashboard.module.css'

function splitName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, ' ')

  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  const [firstName, ...rest] = normalized.split(' ')
  return {
    firstName,
    lastName: rest.join(' '),
  }
}

export function AdminProfileSettings({
  profile,
}: {
  profile: AdminProfileSummary
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    profileImageUrl: profile.profileImageUrl.startsWith('data:image/') ? '' : profile.profileImageUrl,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const saveProfile = async () => {
    const { firstName, lastName } = splitName(form.fullName)

    if (!firstName || !form.phoneNumber.trim()) {
      setError('Name and phone number are required before saving your admin profile.')
      setMessage('')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phoneNumber: form.phoneNumber,
        profileImageUrl: form.profileImageUrl,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not update your admin profile.')
      setLoading(false)
      return
    }

    setMessage('Admin profile updated.')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className={styles.actionStack}>
      <div className={styles.filtersGridCompactWide}>
        <input
          className={styles.input}
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          placeholder="Full name"
        />
        <input
          className={styles.input}
          value={form.phoneNumber}
          onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
          placeholder="Phone number"
        />
      </div>
      <input
        className={styles.input}
        value={form.profileImageUrl}
        onChange={(event) => setForm((current) => ({ ...current, profileImageUrl: event.target.value }))}
        placeholder="Profile image URL"
      />
      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} disabled={loading} onClick={saveProfile}>
          {loading ? 'Saving...' : 'Save Admin Profile'}
        </button>
      </div>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
