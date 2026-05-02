'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import { parseDurationToMinutes } from '@/lib/services/duration'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type ServiceOption = {
  id: string
  name: string
  slug: string
  description: string
  duration: string
  sortOrder: number
  isActive: boolean
}

type DraftMap = Record<
  string,
  {
    price: string
    durationMinutes: string
    isActive: boolean
  }
>

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
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null)
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
        if (!isActive) {
          return
        }

        const validServices = data.filter((service) => isUuid(service.id))
        setServices(validServices)
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

  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      services.map((service) => {
        const existing = prices.find((price) => price.serviceId === service.id)
        return [
          service.id,
          {
            price: existing ? String(existing.price) : '',
            durationMinutes:
              existing?.durationMinutes != null
                ? String(existing.durationMinutes)
                : String(parseDurationToMinutes(service.duration)),
            isActive: existing?.isActive ?? true,
          },
        ]
      })
    )

    setDrafts(nextDrafts)
  }, [prices, services])

  const pricesByServiceId = useMemo(
    () =>
      new Map(
        prices
          .filter((price) => typeof price.serviceId === 'string')
          .map((price) => [price.serviceId as string, price])
      ),
    [prices]
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

  const saveService = async (service: ServiceOption) => {
    const draft = drafts[service.id]
    const existing = pricesByServiceId.get(service.id) ?? null

    if (!draft?.price || Number.parseFloat(draft.price) <= 0) {
      setError(`Enter a valid price for ${service.name}.`)
      setMessage('')
      return
    }

    setLoadingServiceId(service.id)
    setMessage('')
    setError('')

    const response = await fetch(
      existing ? `/api/barber/service-prices/${existing.id}` : '/api/barber/service-prices',
      {
        method: existing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          price: Number.parseFloat(draft.price),
          durationMinutes: Number.parseInt(draft.durationMinutes, 10),
          isActive: draft.isActive,
        }),
      }
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : `Could not save ${service.name}.`
      )
      setLoadingServiceId(null)
      return
    }

    setMessage(existing ? `${service.name} updated.` : `${service.name} added.`)
    setLoadingServiceId(null)
    await loadPrices()
  }

  const deactivateService = async (priceId: string, serviceName: string) => {
    setLoadingServiceId(priceId)
    setMessage('')
    setError('')

    const response = await fetch(`/api/barber/service-prices/${priceId}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? `Could not deactivate ${serviceName}.`)
      setLoadingServiceId(null)
      return
    }

    setMessage(`${serviceName} deactivated.`)
    setLoadingServiceId(null)
    await loadPrices()
  }

  return (
    <div className={styles.formStack}>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.cardGrid}>
        {services.map((service) => {
          const existing = pricesByServiceId.get(service.id) ?? null
          const durationMinutes = parseDurationToMinutes(service.duration)
          const draft = drafts[service.id] ?? {
            price: '',
            durationMinutes: String(durationMinutes),
            isActive: true,
          }
          const isBusy = loadingServiceId === service.id || loadingServiceId === existing?.id

          return (
            <article key={service.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <p className={styles.referenceText}>Approved Service</p>
                  <h3 className={styles.cardTitle}>{service.name}</h3>
                  <p className={styles.cardText}>{service.description}</p>
                </div>
                <div className={styles.badgeCluster}>
                  <span className={styles.secondaryButton}>{service.duration}</span>
                  <span className={styles.secondaryButton}>
                    {existing?.isActive ? 'Active' : existing ? 'Inactive' : 'Not added'}
                  </span>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <span className={styles.metaLabel}>Duration</span>
                  <strong className={styles.metaValue}>
                    {draft.durationMinutes ? `${draft.durationMinutes} min` : `${durationMinutes} min`}
                  </strong>
                </div>
                <div>
                  <span className={styles.metaLabel}>Current Price</span>
                  <strong className={styles.metaValue}>{existing ? `R${existing.price}` : 'Not priced yet'}</strong>
                </div>
                <div>
                  <span className={styles.metaLabel}>Status</span>
                  <strong className={styles.metaValue}>{draft.isActive ? 'Active' : 'Inactive'}</strong>
                </div>
              </div>

              <div className={styles.filtersGridCompactWide}>
                <label className={styles.field}>
                  <span className={styles.metaLabel}>Price</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={styles.input}
                    value={draft.price}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [service.id]: {
                          ...current[service.id],
                          price: event.target.value,
                        },
                      }))
                    }
                    placeholder="150"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.metaLabel}>Duration (min)</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={styles.input}
                    value={draft.durationMinutes}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [service.id]: {
                          ...current[service.id],
                          durationMinutes: event.target.value,
                        },
                      }))
                    }
                    placeholder={String(durationMinutes)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.metaLabel}>Status</span>
                  <div className={styles.toggleGroup}>
                    <button
                      type="button"
                      className={styles.toggleButton}
                      data-active={draft.isActive}
                      onClick={() =>
                        setDrafts((current) => ({
                          ...current,
                          [service.id]: {
                            ...current[service.id],
                            isActive: true,
                          },
                        }))
                      }
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={styles.toggleButton}
                      data-active={!draft.isActive}
                      onClick={() =>
                        setDrafts((current) => ({
                          ...current,
                          [service.id]: {
                            ...current[service.id],
                            isActive: false,
                          },
                        }))
                      }
                    >
                      Inactive
                    </button>
                  </div>
                </label>
              </div>

              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={isBusy}
                  onClick={() => saveService(service)}
                >
                  {isBusy ? 'Saving...' : existing ? 'Save Price' : 'Add Service'}
                </button>
                {existing ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={isBusy}
                    onClick={() => deactivateService(existing.id, service.name)}
                  >
                    Deactivate
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
