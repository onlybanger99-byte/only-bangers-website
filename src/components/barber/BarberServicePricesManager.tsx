'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type ServiceOption = {
  id: string
  name: string
  slug: string
  description: string
  duration: string
  sortOrder: number
}

type PriceFormState = {
  serviceId: string
  price: string
  durationMinutes: string
  isActive: boolean
}

const EMPTY_FORM: PriceFormState = {
  serviceId: '',
  price: '',
  durationMinutes: '30',
  isActive: true,
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export function BarberServicePricesManager({
  initialPrices,
}: {
  initialPrices: BarberServicePriceSummary[]
}) {
  const [prices, setPrices] = useState(initialPrices)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [form, setForm] = useState<PriceFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setPrices(initialPrices)
  }, [initialPrices])

  useEffect(() => {
    let isActive = true

    fetch('/api/services')
      .then(async (response) => {
        const payload = await response.json()

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? 'Could not load approved services.')
        }

        return Array.isArray(payload.data) ? (payload.data as ServiceOption[]) : []
      })
      .then((data) => {
        if (isActive) {
          const validServices = data.filter((service) => isUuid(service.id))

          if (validServices.length !== data.length) {
            console.error('[barber-service-prices] Non-UUID services received from API:', data)
            setError('Approved services are not configured correctly. Please contact support.')
          }

          setServices(validServices)
        }
      })
      .catch((loadError) => {
        console.error('[barber-service-prices] Failed to load service catalog:', loadError)
        if (isActive) {
          setError('Could not load approved services.')
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId) ?? null,
    [form.serviceId, services]
  )

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
    setError('')
  }

  const handleServiceSelection = (value: string) => {
    const existing = prices.find((price) => price.serviceId === value) ?? null

    if (existing) {
      startEditing(existing)
      setMessage('Existing service price loaded for editing.')
      return
    }

    setEditingId(null)
    setForm((current) => ({
      ...current,
      serviceId: value,
      isActive: true,
    }))
    setMessage('')
    setError('')
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.serviceId) {
      setError('Select an approved service before saving.')
      return
    }

    if (!isUuid(form.serviceId)) {
      setError('The selected service is invalid. Reload the page and try again.')
      return
    }

    if (!form.price || Number.parseFloat(form.price) <= 0) {
      setError('Enter a valid price greater than 0.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    const requestBody = {
      serviceId: form.serviceId,
      price: Number.parseFloat(form.price),
      durationMinutes: form.durationMinutes ? Number.parseInt(form.durationMinutes, 10) : null,
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
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : 'Could not save this service price.'
      )
      setSaving(false)
      return
    }

    setMessage(editingId ? 'Service price updated successfully.' : 'Service price added successfully.')
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
    if (editingId === id) {
      resetForm()
    }
    await loadPrices()
  }

  return (
    <div className={styles.formStack}>
      <form className={styles.formGrid} onSubmit={submit}>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Approved Service</span>
          <select
            className={styles.input}
            value={form.serviceId}
            onChange={(event) => handleServiceSelection(event.target.value)}
            required
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Price</span>
          <input
            type="number"
            min="1"
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

      {selectedService ? (
        <div className={styles.panelCard}>
          <p className={styles.eyebrow}>Selected Service</p>
          <h3 className={styles.cardTitle}>{selectedService.name}</h3>
          <p className={styles.cardText}>{selectedService.description}</p>
        </div>
      ) : null}

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
        <p className={styles.cardSubmeta}>No approved services have been priced yet.</p>
      )}
    </div>
  )
}
