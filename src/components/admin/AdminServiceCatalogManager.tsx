'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminServiceRow } from '@/lib/admin-dashboard/types'
import { AdminModal } from './AdminModal'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type DraftMap = Record<
  string,
  {
    description: string
    isActive: boolean
    sortOrder: number
    imageUrl: string
    backgroundImageUrl: string
    mediaStoragePath: string
  }
>

export function AdminServiceCatalogManager({
  services,
}: {
  services: AdminServiceRow[]
}) {
  const router = useRouter()
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftMap>(
    Object.fromEntries(
      services.map((service) => [
        service.id,
        {
          description: service.description,
          isActive: service.isActive,
          sortOrder: service.sortOrder,
          imageUrl: service.imageUrl ?? '',
          backgroundImageUrl: service.backgroundImageUrl ?? '',
          mediaStoragePath: service.mediaStoragePath ?? '',
        },
      ])
    )
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  )

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        services.map((service) => [
          service.id,
          {
            description: service.description,
            isActive: service.isActive,
            sortOrder: service.sortOrder,
            imageUrl: service.imageUrl ?? '',
            backgroundImageUrl: service.backgroundImageUrl ?? '',
            mediaStoragePath: service.mediaStoragePath ?? '',
          },
        ])
      )
    )
  }, [services])

  const formatError = (payload: any, fallback: string) => {
    const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
    return payload?.error?.message ? `${payload.error.message}${details ? ` ${details}` : ''}` : fallback
  }

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
      setError(formatError(payload, 'Could not update this service.'))
      setLoadingId(null)
      return
    }

    setMessage(`Updated ${payload.data?.name ?? 'service'}.`)
    setLoadingId(null)
    router.refresh()
  }

  const uploadServiceImage = async (
    serviceId: string,
    field: 'image' | 'background',
    file: File
  ) => {
    setUploadingId(serviceId)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.set('file', file)
    formData.set('field', field)

    const response = await fetch(`/api/admin/services/${serviceId}/upload`, {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(formatError(payload, 'Could not upload this service image.'))
      setUploadingId(null)
      return
    }

    setMessage(`Uploaded ${field} image for ${payload.data?.name ?? 'service'}.`)
    setUploadingId(null)
    router.refresh()
  }

  return (
    <>
      <div className={styles.cardGrid}>
        {services.map((service) => {
          const previewUrl = service.imageUrl || service.mediaImageUrl
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

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={service.name}
                  style={{ width: '100%', height: '10rem', objectFit: 'cover', borderRadius: '1rem' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '10rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(212, 175, 55, 0.14)',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(12, 12, 12, 0.92))',
                  }}
                />
              )}

              <p className={styles.cardText}>{service.description}</p>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setSelectedServiceId(service.id)}
              >
                Manage
              </button>
            </article>
          )
        })}
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <AdminModal
        open={selectedService !== null}
        title={selectedService?.name ?? 'Manage service'}
        subtitle={selectedService?.slug}
        onClose={() => setSelectedServiceId(null)}
      >
        {selectedService ? (
          <div className={styles.modalContent}>
            <div className={styles.badgeCluster}>
              <span className={styles.secondaryButton}>{selectedService.duration}</span>
              <span className={styles.secondaryButton}>{selectedService.minPriceLabel}</span>
            </div>

            <label className={styles.field}>
              <span className={styles.metaLabel}>Description</span>
              <textarea
                className={styles.input}
                rows={4}
                value={drafts[selectedService.id]?.description ?? ''}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [selectedService.id]: {
                      ...current[selectedService.id],
                      description: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <div className={styles.filtersGridCompactWide}>
              <label className={styles.field}>
                <span className={styles.metaLabel}>Sort Order</span>
                <input
                  type="number"
                  className={styles.input}
                  value={drafts[selectedService.id]?.sortOrder ?? selectedService.sortOrder}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [selectedService.id]: {
                        ...current[selectedService.id],
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
                    data-active={drafts[selectedService.id]?.isActive ?? selectedService.isActive}
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        [selectedService.id]: {
                          ...current[selectedService.id],
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
                    data-active={!(drafts[selectedService.id]?.isActive ?? selectedService.isActive)}
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        [selectedService.id]: {
                          ...current[selectedService.id],
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

            <label className={styles.field}>
              <span className={styles.metaLabel}>Service Image URL</span>
              <input
                className={styles.input}
                value={drafts[selectedService.id]?.imageUrl ?? ''}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [selectedService.id]: {
                      ...current[selectedService.id],
                      imageUrl: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.metaLabel}>Service Background Image URL</span>
              <input
                className={styles.input}
                value={drafts[selectedService.id]?.backgroundImageUrl ?? ''}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [selectedService.id]: {
                      ...current[selectedService.id],
                      backgroundImageUrl: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <div className={styles.inlineActions}>
              <label className={styles.secondaryButton} style={{ cursor: 'pointer' }}>
                {uploadingId === selectedService.id ? 'Uploading...' : 'Upload Service Image'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                      void uploadServiceImage(selectedService.id, 'image', file)
                    }

                    event.target.value = ''
                  }}
                />
              </label>

              <label className={styles.secondaryButton} style={{ cursor: 'pointer' }}>
                {uploadingId === selectedService.id ? 'Uploading...' : 'Upload Background'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                      void uploadServiceImage(selectedService.id, 'background', file)
                    }

                    event.target.value = ''
                  }}
                />
              </label>

              <button
                type="button"
                className={styles.primaryButton}
                disabled={loadingId === selectedService.id}
                onClick={() => saveService(selectedService.id)}
              >
                {loadingId === selectedService.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </>
  )
}
