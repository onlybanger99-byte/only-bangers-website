'use client'

import { useEffect, useState } from 'react'
import { services } from '@/data/services'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type PriceFormState = {
  serviceId: string
  serviceName: string
  price: string
  durationMinutes: string
  isActive: boolean
}

const EMPTY_FORM: PriceFormState = {
  serviceId: '',
  serviceName: '',
  price: '',
  durationMinutes: '30',
  isActive: true,
}

export function BarberServicePricesManager({
  initialPrices,
}: {
  initialPrices: BarberServicePriceSummary[]
}) {
  const [prices, setPrices] = useState(initialPrices)
  const [form, setForm] = useState<PriceFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setPrices(initialPrices)
  }, [initialPrices])

  async function loadPrices() {
    const response = await fetch('/api/barber/service-prices')
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not load barber prices.')
      return
    }

    setPrices(Array.isArray(payload.data) ? payload.data : [])
  }

  const startEditing = (price: BarberServicePriceSummary) => {
    setEditingId(price.id)
    setForm({
      serviceId: price.serviceId ?? '',
      serviceName: price.serviceName,
      price: String(price.price),
      durationMinutes: price.durationMinutes ? String(price.durationMinutes) : '30',
      isActive: price.isActive,
    })
    setMessage('')
    setError('')
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleServiceSelection = (value: string) => {
    const selected = services.find((service) => service.id === value)

    setForm((current) => ({
      ...current,
      serviceId: value,
      serviceName: selected?.name ?? current.serviceName,
    }))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const requestBody = {
      serviceId: form.serviceId || null,
      serviceName: form.serviceName,
      price: Number.parseFloat(form.price),
      durationMinutes: Number.parseInt(form.durationMinutes, 10),
      isActive: form.isActive,
    }

    const response = await fetch(
      editingId ? `/api/barber/service-prices/${editingId}` : '/api/barber/service-prices',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not save this service price.')
      setSaving(false)
      return
    }

    setMessage(editingId ? 'Service price updated.' : 'Service price added.')
    resetForm()
    setSaving(false)
    await loadPrices()
  }

  const deactivate = async (id: string) => {
    setMessage('')
    setError('')

    const response = await fetch(`/api/barber/service-prices/${id}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not remove this service price.')
      return
    }

    setMessage('Service price deactivated.')
    await loadPrices()
  }

  return (
    <div className={styles.formStack}>
      <form className={styles.formGrid} onSubmit={submit}>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Existing Service</span>
          <select
            className={styles.input}
            value={form.serviceId}
            onChange={(event) => handleServiceSelection(event.target.value)}
          >
            <option value="">Custom service name</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Service Name</span>
          <input
            className={styles.input}
            value={form.serviceName}
            onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))}
            placeholder="Classic Cut"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Price</span>
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            placeholder="150"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Duration Minutes</span>
          <input
            type="number"
            min="5"
            step="5"
            className={styles.input}
            value={form.durationMinutes}
            onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
            placeholder="30"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Status</span>
          <select
            className={styles.input}
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(event) =>
              setForm((current) => ({ ...current, isActive: event.target.value === 'active' }))
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className={styles.field}>
          <span className={styles.metaLabel}>Action</span>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Price' : 'Add Service'}
          </button>
        </div>
      </form>

      {editingId ? (
        <div className={styles.inlineActions}>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>
            Cancel Edit
          </button>
        </div>
      ) : null}

      {message ? <p className={styles.cardSubmeta}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      {prices.length > 0 ? (
        <div className={styles.cardGrid}>
          {prices.map((price) => (
            <article key={price.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <p className={styles.referenceText}>Service Price</p>
                  <h3 className={styles.cardTitle}>{price.serviceName}</h3>
                  <p className={styles.cardMeta}>R{price.price}</p>
                </div>
                <div className={styles.badgeCluster}>
                  <span className={styles.secondaryButton}>
                    {price.durationMinutes ? `${price.durationMinutes} min` : 'Duration not set'}
                  </span>
                  <span className={styles.secondaryButton}>{price.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              <div className={styles.inlineActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => startEditing(price)}>
                  Edit
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => deactivate(price.id)}>
                  Deactivate
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.cardSubmeta}>No services or prices added yet.</p>
      )}
    </div>
  )
}
