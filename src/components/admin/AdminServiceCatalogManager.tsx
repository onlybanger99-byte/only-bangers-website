'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminServiceRow } from '@/lib/admin-dashboard/types'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type DraftMap = Record<
  string,
  {
    description: string
    isActive: boolean
    sortOrder: number
  }
>

export function AdminServiceCatalogManager({
  services,
}: {
  services: AdminServiceRow[]
}) {
  const router = useRouter()
  const [drafts, setDrafts] = useState<DraftMap>(
    Object.fromEntries(
      services.map((service) => [
        service.id,
        {
          description: service.description,
          isActive: service.isActive,
          sortOrder: service.sortOrder,
        },
      ])
    )
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const saveService = async (serviceId: string) => {
    const draft = drafts[serviceId]

    if (!draft) {
      return
    }

    setLoadingId(serviceId)
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/services/${serviceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not update this service.')
      setLoadingId(null)
      return
    }

    setMessage(`Updated ${payload.data?.name ?? 'service'}.`)
    setLoadingId(null)
    router.refresh()
  }

  return (
    <div className={styles.cardGrid}>
      {services.map((service) => {
        const draft = drafts[service.id]
        return (
          <article key={service.id} className={styles.recordCard}>
            <div className={styles.recordTop}>
              <div>
                <p className={styles.referenceText}>{service.slug}</p>
                <h3 className={styles.cardTitle}>{service.name}</h3>
                <p className={styles.cardSubmeta}>{service.duration}</p>
              </div>
              <div className={styles.badgeCluster}>
                <span className={styles.secondaryButton}>{service.minPriceLabel}</span>
                <span className={styles.secondaryButton}>
                  {service.barberCount} barber{service.barberCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <textarea
              className={styles.input}
              rows={3}
              value={draft?.description ?? ''}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [service.id]: {
                    ...current[service.id],
                    description: event.target.value,
                  },
                }))
              }
            />

            <div className={styles.filtersGridCompactWide}>
              <label className={styles.field}>
                <span className={styles.metaLabel}>Sort Order</span>
                <input
                  type="number"
                  className={styles.input}
                  value={draft?.sortOrder ?? service.sortOrder}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [service.id]: {
                        ...current[service.id],
                        sortOrder: Number.parseInt(event.target.value, 10) || 0,
                      },
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.metaLabel}>Status</span>
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    data-active={draft?.isActive ?? service.isActive}
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
                    className={styles.secondaryButton}
                    data-active={!(draft?.isActive ?? service.isActive)}
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
                disabled={loadingId === service.id}
                onClick={() => saveService(service.id)}
              >
                {loadingId === service.id ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </article>
        )
      })}

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
