'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type AppRole = 'customer' | 'barber' | 'admin'

export function AdminUserActions({
  userId,
  currentRole,
  editable,
}: {
  userId: string
  currentRole: AppRole
  editable: boolean
}) {
  const router = useRouter()
  const [role, setRole] = useState<AppRole>(currentRole)
  const [loadingAction, setLoadingAction] = useState<'role' | 'delete' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateRole = async () => {
    setLoadingAction('role')
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not update this role.')
      setLoadingAction(null)
      return
    }

    setMessage('Role updated.')
    setLoadingAction(null)
    router.refresh()
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
      <div className={styles.inlineActions}>
        <select
          className={styles.input}
          value={role}
          onChange={(event) => setRole(event.target.value as AppRole)}
          aria-label="Change user role"
        >
          <option value="customer">Customer</option>
          <option value="barber">Barber</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={loadingAction !== null}
          onClick={updateRole}
        >
          {loadingAction === 'role' ? 'Saving...' : 'Change Role'}
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          disabled={loadingAction !== null}
          onClick={deleteUser}
        >
          {loadingAction === 'delete' ? 'Deleting...' : 'Delete User'}
        </button>
      </div>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
