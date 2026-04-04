'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './unlock.module.css';

export default function AdminUnlockPage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });

      if (!response.ok) {
        setError('Invalid admin secret');
        setLoading(false);
        return;
      }

      // Success - redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      setError('Failed to unlock admin panel');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Access Required</h1>
          <p className={styles.subtitle}>Enter the admin secret to continue</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="secret" className={styles.label}>
              Admin Secret
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter admin secret"
              className={styles.input}
              disabled={loading}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !secret.trim()}
          >
            {loading ? 'Verifying...' : 'Unlock Admin Panel'}
          </button>
        </form>

        <p className={styles.note}>
          Phase 4 feature: Temporary admin authentication. This will be replaced with proper RBAC in Phase 5.
        </p>
      </div>
    </div>
  );
}
