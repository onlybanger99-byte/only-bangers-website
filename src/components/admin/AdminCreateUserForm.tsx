'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type AppRole = 'customer' | 'barber' | 'admin'

export function AdminCreateUserForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('customer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        role,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not create this user.')
      setLoading(false)
      return
    }

    setEmail('')
    setPassword('')
    setRole('customer')
    setMessage('User created.')
    setLoading(false)
    router.refresh()
  }

  return (
    <form className={styles.filtersGridCompact} onSubmit={createUser}>
      <input
        type="email"
        className={styles.input}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        required
      />
      <input
        type="password"
        className={styles.input}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Temporary password"
        required
      />
      <select className={styles.input} value={role} onChange={(event) => setRole(event.target.value as AppRole)}>
        <option value="customer">Customer</option>
        <option value="barber">Barber</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className={styles.primaryButton} disabled={loading}>
        {loading ? 'Creating...' : 'Add User'}
      </button>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </form>
  )
}
