'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type AppRole = 'customer' | 'barber' | 'admin'
type AccountStatus = 'active' | 'suspended' | 'pending'

export function AdminUserActions({
  userId,
  currentRole,
  currentEmail,
  displayName,
  firstName,
  lastName,
  phoneNumber,
  accountStatus,
  editable,
}: {
  userId: string
  currentRole: AppRole
  currentEmail: string
  displayName: string
  firstName: string
  lastName: string
  phoneNumber: string
  accountStatus: AccountStatus
  editable: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    email: currentEmail,
    displayName,
    firstName,
    lastName,
    phoneNumber,
    role: currentRole,
    accountStatus,
  })
  const [loadingAction, setLoadingAction] = useState<'save' | 'delete' | 'resend' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const saveChanges = async () => {
    setLoadingAction('save')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.email,
        displayName: form.displayName,
        fullName: `${form.firstName} ${form.lastName}`.trim() || form.displayName,
        phoneNumber: form.phoneNumber,
        role: form.role,
        accountStatus: form.accountStatus,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not update this user.')
      setLoadingAction(null)
      return
    }

    setMessage('User updated.')
    setLoadingAction(null)
    router.refresh()
  }

  const resendConfirmation = async () => {
    setLoadingAction('resend')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/users/${userId}/resend-confirmation`, {
      method: 'POST',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not resend the setup email.')
      setLoadingAction(null)
      return
    }

    setMessage('Account setup email sent.')
    setLoadingAction(null)
  }

  const deleteUser = async () => {
    if (!window.confirm('Delete this user account and related profile data?')) {
      return
    }

    setLoadingAction('delete')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not delete this user.')
      setLoadingAction(null)
      return
    }

    setMessage('User deleted.')
    setLoadingAction(null)
    router.refresh()
  }

  if (!editable) {
    return null
  }

  return (
    <div className={styles.actionStack}>
      <div className={styles.filtersGridCompactWide}>
        <input className={styles.input} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
        <input className={styles.input} value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display name" />
        <input className={styles.input} value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="First name" />
        <input className={styles.input} value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Last name" />
        <input className={styles.input} value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="Phone" />
        <select className={styles.input} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AppRole }))}>
          <option value="customer">Customer</option>
          <option value="barber">Barber</option>
          <option value="admin">Admin</option>
        </select>
        <select className={styles.input} value={form.accountStatus} onChange={(event) => setForm((current) => ({ ...current, accountStatus: event.target.value as AccountStatus }))}>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} disabled={loadingAction !== null} onClick={saveChanges}>
          {loadingAction === 'save' ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className={styles.secondaryButton} disabled={loadingAction !== null} onClick={resendConfirmation}>
          {loadingAction === 'resend' ? 'Sending...' : 'Resend Confirmation Email'}
        </button>
        <button type="button" className={styles.dangerButton} disabled={loadingAction !== null} onClick={deleteUser}>
          {loadingAction === 'delete' ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
