'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerProfileSummary } from '@/lib/customer-profiles/types'
import styles from '@/app/portal/profile/complete/complete.module.css'

export function CompleteProfileForm({
  nextPath,
  initialProfile,
}: {
  nextPath: string
  initialProfile: CustomerProfileSummary | null
}) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: initialProfile?.firstName ?? '',
    lastName: initialProfile?.lastName ?? '',
    phoneNumber: initialProfile?.phoneNumber ?? '',
    profileImageUrl: initialProfile?.profileImageUrl ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.profileImageUrl.trim()
    ) {
      setErrorMessage('Complete your profile to continue. Add your name, phone number, and profile photo URL.')
      return
    }

    setSaving(true)
    setErrorMessage('')

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const payload = await response.json()

    if (!response.ok || !payload.ok) {
      setErrorMessage(
        payload?.error?.message ?? 'We could not save your profile. Please try again.'
      )
      setSaving(false)
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>First name</span>
          <input
            value={formData.firstName}
            onChange={(event) =>
              setFormData((current) => ({ ...current, firstName: event.target.value }))
            }
            required
          />
        </label>

        <label className={styles.field}>
          <span>Last name</span>
          <input
            value={formData.lastName}
            onChange={(event) =>
              setFormData((current) => ({ ...current, lastName: event.target.value }))
            }
            required
          />
        </label>

        <label className={styles.field}>
          <span>Phone number</span>
          <input
            value={formData.phoneNumber}
            onChange={(event) =>
              setFormData((current) => ({ ...current, phoneNumber: event.target.value }))
            }
            required
          />
        </label>

        <label className={styles.field}>
          <span>Profile image URL</span>
          <input
            value={formData.profileImageUrl}
            onChange={(event) =>
              setFormData((current) => ({ ...current, profileImageUrl: event.target.value }))
            }
            placeholder="https://..."
            required
          />
        </label>

      </div>

      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

      <div className={styles.actions}>
        <button type="submit" disabled={saving} className={styles.primaryButton}>
          {saving ? 'Saving profile...' : 'Save and continue'}
        </button>
      </div>
    </form>
  )
}
