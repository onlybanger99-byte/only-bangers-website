'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import { parseDurationToMinutes } from '@/lib/services/duration'
import { BarberDashboardModal } from './BarberDashboardModal'
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

type DraftState = {
  price: string
  durationMinutes: string
  isActive: boolean
}

type FeedbackState = {
  message?: string
  error?: string
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
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null)
  const [feedbackByService, setFeedbackByService] = useState<Record<string, FeedbackState>>({})
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    setPrices(initialPrices)
  }, [initialPrices])

  useEffect(() => {
    let mounted = true

    fetch('/api/services')
      .then(async (response) => {
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? 'Could not load approved services.')
        }

        return Array.isArray(payload.data) ? (payload.data as ServiceOption[]) : []
      })
      .then((data) => {
        if (!mounted) {
          return
        }

        setServices(
          data
            .filter((service) => isUuid(service.id))
            .sort((left, right) => left.sortOrder - right.sortOrder)
        )
      })
      .catch((error) => {
        console.error('[barber-service-prices] Failed to load service catalog:', error)
        if (mounted) {
          setCatalogError('Could not load approved services.')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const pricesByServiceId = useMemo(
    () =>
      new Map(
        prices
          .filter((price) => typeof price.serviceId === 'string')
          .map((price) => [price.serviceId as string, price])
      ),
    [prices]
  )

  const activeService = useMemo(
    () => services.find((service) => service.id === activeServiceId) ?? null,
    [activeServiceId, services]
  )

  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      services.map((service) => {
        const existing = pricesByServiceId.get(service.id)
        return [
          service.id,
          {
            price: existing ? String(existing.price) : '',
            durationMinutes:
              existing?.durationMinutes != null
                ? String(existing.durationMinutes)
                : String(parseDurationToMinutes(service.duration)),
            isActive: existing?.isActive ?? true,
          } satisfies DraftState,
        ]
      })
    )

    setDrafts(nextDrafts)
  }, [pricesByServiceId, services])

  async function loadPrices() {
    const response = await fetch('/api/barber/service-prices')
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setCatalogError(payload?.error?.message ?? 'Could not load barber prices.')
      return
    }

    setPrices(Array.isArray(payload.data) ? payload.data : [])
  }

  function setDraft(serviceId: string, updater: (current: DraftState) => DraftState) {
    setDrafts((current) => ({
      ...current,
      [serviceId]: updater(
        current[serviceId] ?? {
          price: '',
          durationMinutes: '',
          isActive: true,
        }
      ),
    }))
  }

  function setFeedback(serviceId: string, feedback: FeedbackState) {
    setFeedbackByService((current) => ({
      ...current,
      [serviceId]: feedback,
    }))
  }

  async function saveService(service: ServiceOption) {
    const draft = drafts[service.id]
    const existing = pricesByServiceId.get(service.id) ?? null
    const price = Number.parseFloat(draft?.price ?? '')
    const durationMinutes = Number.parseInt(draft?.durationMinutes ?? '', 10)

    if (!draft?.price || !Number.isFinite(price) || price <= 0) {
      setFeedback(service.id, { error: 'Price must be greater than 0.' })
      return
    }

    if (!draft?.durationMinutes || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setFeedback(service.id, { error: 'Duration must be greater than 0 minutes.' })
      return
    }

    setLoadingServiceId(service.id)
    setFeedback(service.id, {})

    const response = await fetch(
      existing ? `/api/barber/service-prices/${existing.id}` : '/api/barber/service-prices',
      {
        method: existing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          price,
          durationMinutes,
          isActive: draft.isActive,
        }),
      }
    )
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setFeedback(service.id, {
        error: payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : `Could not save ${service.name}.`,
      })
      setLoadingServiceId(null)
      return
    }

    setFeedback(service.id, {
      message: existing ? `${service.name} updated.` : `${service.name} saved.`,
    })
    setLoadingServiceId(null)
    await loadPrices()
    setActiveServiceId(null)
  }

  async function deactivateService(serviceId: string, serviceName: string) {
    const existing = pricesByServiceId.get(serviceId)

    if (!existing) {
      return
    }

    setLoadingServiceId(serviceId)
    setFeedback(serviceId, {})

    const response = await fetch(`/api/barber/service-prices/${existing.id}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setFeedback(serviceId, {
        error: payload?.error?.message ?? `Could not deactivate ${serviceName}.`,
      })
      setLoadingServiceId(null)
      return
    }

    setFeedback(serviceId, { message: `${serviceName} deactivated.` })
    setLoadingServiceId(null)
    await loadPrices()
    setActiveServiceId(null)
  }

  return (
    <div className={styles.formStack}>
      {catalogError ? <p className={styles.errorText}>{catalogError}</p> : null}

      <div className={styles.serviceButtonGrid}>
        {services.map((service) => {
          const existing = pricesByServiceId.get(service.id) ?? null
          const feedback = feedbackByService[service.id]

          return (
            <article key={service.id} className={styles.serviceSummaryCard}>
              <div className={styles.serviceSummaryCopy}>
                <p className={styles.referenceText}>{service.name}</p>
                <p className={styles.cardSubmeta}>
                  {existing ? `R${existing.price}` : 'Price not set'} ·{' '}
                  {existing?.durationMinutes ? `${existing.durationMinutes} min` : 'Duration not set'}
                </p>
              </div>

              <div className={styles.serviceSummaryActions}>
                <span className={styles.secondaryButton}>
                  {existing?.isActive ? 'Active' : existing ? 'Inactive' : 'Incomplete'}
                </span>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setActiveServiceId(service.id)}
                >
                  Edit
                </button>
              </div>

              {feedback?.message ? <p className={styles.successText}>{feedback.message}</p> : null}
              {feedback?.error ? <p className={styles.errorText}>{feedback.error}</p> : null}
            </article>
          )
        })}
      </div>

      <BarberDashboardModal
        open={Boolean(activeService)}
        onClose={() => setActiveServiceId(null)}
        eyebrow="Services"
        title={activeService?.name ?? 'Edit Service'}
        subtitle={activeService?.description ?? 'Update the service price, duration, and active state.'}
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setActiveServiceId(null)}>
              Cancel
            </button>
            {activeService && pricesByServiceId.get(activeService.id) ? (
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={loadingServiceId === activeService.id}
                onClick={() => void deactivateService(activeService.id, activeService.name)}
              >
                {loadingServiceId === activeService.id ? 'Saving...' : 'Deactivate'}
              </button>
            ) : null}
            {activeService ? (
              <button
                type="button"
                className={styles.primaryButton}
                disabled={loadingServiceId === activeService.id}
                onClick={() => void saveService(activeService)}
              >
                {loadingServiceId === activeService.id ? 'Saving...' : 'Save Service'}
              </button>
            ) : null}
          </div>
        }
      >
        {activeService ? (
          <div className={styles.formStack}>
            <div className={styles.summaryCard}>
              <p className={styles.referenceText}>Approved service</p>
              <p className={styles.cardSubmeta}>{activeService.description}</p>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.metaLabel}>Price</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={styles.input}
                  value={drafts[activeService.id]?.price ?? ''}
                  onChange={(event) =>
                    setDraft(activeService.id, (current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="150"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.metaLabel}>Duration</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={styles.input}
                  value={drafts[activeService.id]?.durationMinutes ?? ''}
                  onChange={(event) =>
                    setDraft(activeService.id, (current) => ({
                      ...current,
                      durationMinutes: event.target.value,
                    }))
                  }
                  placeholder={String(parseDurationToMinutes(activeService.duration))}
                />
              </label>
            </div>

            <div className={styles.inlineFieldRow}>
              <span className={styles.metaLabel}>Status</span>
              <div className={styles.toggleGroup}>
                <button
                  type="button"
                  className={styles.toggleButton}
                  data-active={drafts[activeService.id]?.isActive}
                  onClick={() =>
                    setDraft(activeService.id, (current) => ({
                      ...current,
                      isActive: true,
                    }))
                  }
                >
                  Active
                </button>
                <button
                  type="button"
                  className={styles.toggleButton}
                  data-active={!drafts[activeService.id]?.isActive}
                  onClick={() =>
                    setDraft(activeService.id, (current) => ({
                      ...current,
                      isActive: false,
                    }))
                  }
                >
                  Inactive
                </button>
              </div>
            </div>

            {feedbackByService[activeService.id]?.message ? (
              <p className={styles.successText}>{feedbackByService[activeService.id]?.message}</p>
            ) : null}
            {feedbackByService[activeService.id]?.error ? (
              <p className={styles.errorText}>{feedbackByService[activeService.id]?.error}</p>
            ) : null}
          </div>
        ) : null}
      </BarberDashboardModal>
    </div>
  )
}
