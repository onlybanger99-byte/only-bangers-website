'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { CustomerProfileSummary } from '@/lib/customer-profiles/types'
import styles from '@/app/portal/profile/complete/complete.module.css'

export function CompleteProfileForm({
  nextPath,
  initialProfile,
  requirePasswordSetup = false,
}: {
  nextPath: string
  initialProfile: CustomerProfileSummary | null
  requirePasswordSetup?: boolean
}) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: [initialProfile?.firstName, initialProfile?.lastName].filter(Boolean).join(' ').trim(),
    phoneNumber: initialProfile?.phoneNumber ?? '',
    profileImageUrl: initialProfile?.profileImageUrl ?? '',
    password: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const splitName = (fullName: string) => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { firstName, lastName } = splitName(formData.fullName)

    if (!firstName || !formData.phoneNumber.trim()) {
      setErrorMessage('Complete your profile to continue. Add your name and phone number.')
      setSuccessMessage('')
      return
    }

    if (requirePasswordSetup) {
      if (!formData.password.trim()) {
        setErrorMessage('Create a password before continuing.')
        setSuccessMessage('')
        return
      }

      if (formData.password.length < 6) {
        setErrorMessage('Your password must be at least 6 characters long.')
        setSuccessMessage('')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Password and confirm password must match.')
        setSuccessMessage('')
        return
      }
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (requirePasswordSetup) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (passwordError) {
        setErrorMessage(passwordError.message || 'We could not secure your password right now.')
        setSaving(false)
        return
      }
    }

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phoneNumber: formData.phoneNumber,
        profileImageUrl: formData.profileImageUrl,
      }),
    })

    const payload = await response.json()

    if (!response.ok || !payload.ok) {
      setErrorMessage(payload?.error?.message ?? 'We could not save your profile. Please try again.')
      setSaving(false)
      return
    }

    setSuccessMessage('Profile saved. Redirecting to your dashboard...')
    router.replace(nextPath)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      {requirePasswordSetup ? (
        <p className={styles.cardSubmeta}>
          Set your password so you can log in with email and password later.
        </p>
      ) : null}

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Full name</span>
          <input
            value={formData.fullName}
            onChange={(event) =>
              setFormData((current) => ({ ...current, fullName: event.target.value }))
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
          />
        </label>

        {requirePasswordSetup ? (
          <>
            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                minLength={6}
                value={formData.password}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>

            <label className={styles.field}>
              <span>Confirm password</span>
              <input
                type="password"
                minLength={6}
                value={formData.confirmPassword}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                required
              />
            </label>
          </>
        ) : null}
      </div>

      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

      <div className={styles.actions}>
        <button type="submit" disabled={saving} className={styles.primaryButton}>
          {saving ? 'Saving profile...' : 'Save and continue'}
        </button>
      </div>
    </form>
  )
}
