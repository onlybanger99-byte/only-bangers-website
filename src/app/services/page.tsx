'use client'

import { useEffect, useState } from 'react'
import BookingFlowModal from '@/components/BookingFlowModal'
import { SitePageBackground } from '@/components/site/SitePageBackground'
import { readBookingDraft } from '@/lib/bookings/draft'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getServiceImage, getSiteContentImage, getSiteContentValue } from '@/lib/site-content/public'
import { getSafeImage, getSafeImageUrl } from '@/lib/safe-image'
import styles from './services.module.css'

type ServiceCard = {
  id: string
  slug: string
  name: string
  description: string
  duration: string
  price: number
  image: string
  imageUrl: string | null
  backgroundImageUrl: string | null
  priceLabel: string
}

type PublicServicePriceSummary = {
  serviceId: string | null
  serviceName: string
  minPrice: number | null
}

type ServiceOption = {
  id: string
  slug: string
  name: string
  description: string
  duration: string
  imageUrl?: string | null
  backgroundImageUrl?: string | null
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function getPriceDisplayLabel(price?: number | null) {
  if (price == null || !Number.isFinite(price)) {
    return 'Prices vary by barber'
  }

  return `From R${price}`
}

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([])
  const { contentMap } = useSiteContent()

  const servicesBackground = getSiteContentImage(contentMap, 'services_background_image', '') || getSafeImage(null)
  const whatsappUrl = getSiteContentValue(contentMap, 'footer_whatsapp_url', 'https://wa.me/27699864730')
  const businessPhone = getSiteContentValue(contentMap, 'business_phone', '+27 661591976')

  useEffect(() => {
    let isActive = true

    Promise.all([
      fetch('/api/services').then((response) => response.json()),
      fetch('/api/barbers/service-prices').then((response) => response.json()),
    ])
      .then(([servicesPayload, summariesPayload]) => {
        if (!isActive) {
          return
        }

        const activeServices = Array.isArray(servicesPayload?.data)
          ? (servicesPayload.data as ServiceOption[]).filter((service) => isUuid(service.id))
          : []
        const summaries = Array.isArray(summariesPayload?.data)
          ? (summariesPayload.data as PublicServicePriceSummary[])
          : []
        const byService = new Map(
          summaries
            .filter((summary) => typeof summary.serviceId === 'string')
            .map((summary) => [summary.serviceId as string, summary])
        )

        setServiceCards(
          activeServices.map((service) => ({
            id: service.id,
            slug: service.slug,
            name: service.name,
            description: service.description,
            duration: service.duration,
            price: 0,
            imageUrl: getServiceImage(contentMap, {
              slug: service.slug,
              imageUrl: service.imageUrl,
            }),
            image:
              getServiceImage(contentMap, {
                slug: service.slug,
                imageUrl: service.imageUrl,
              }) || getSafeImage(null),
            backgroundImageUrl: getSafeImageUrl(service.backgroundImageUrl) ?? null,
            priceLabel: getPriceDisplayLabel(byService.get(service.id)?.minPrice ?? null),
          }))
        )
      })
      .catch((error) => {
        console.error('[services] Failed to load fixed service catalog:', error)
      })

    return () => {
      isActive = false
    }
  }, [contentMap])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('resumeBooking') !== '1') {
      return
    }

    const draft = readBookingDraft()

    if (!draft) {
      params.delete('resumeBooking')
      const nextQuery = params.toString()
      window.history.replaceState({}, '', nextQuery ? `/services?${nextQuery}` : '/services')
      return
    }

    const matchingService = serviceCards.find((service) => service.id === draft.serviceId)

    if (matchingService) {
      setSelectedService(matchingService)
      setShowBookingModal(true)
    }
  }, [serviceCards])

  const handleBookService = (service: ServiceCard) => {
    setSelectedService(service)
    setShowBookingModal(true)
  }

  return (
    <SitePageBackground backgroundKeys={['global_page_background', 'services_background_image', 'site_background_image']}>
      <div className="main-content">
        <div className="page-header" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${servicesBackground}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '1.25rem', padding: '1.5rem' }}>
          <h1 className="page-title">Our Services</h1>
          <p className="page-subtitle">Choose one of our approved cuts, then pick the barber and price that work for you.</p>
        </div>

        <div className="services-grid">
          {serviceCards.map((service) => (
            <div key={service.id} className="service-card">
              <div className="image-container-card">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url('${getSafeImage(null)}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    aria-label={`${service.name} fallback`}
                  />
                )}
              </div>

              <div className="card-content">
                <h3 className="card-title">{service.name}</h3>
                <p className="card-description">{service.description}</p>

                <div className="card-details">
                  <span className="card-price">{service.priceLabel}</span>
                  <span className="card-duration" aria-label={`Duration: ${service.duration}`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.duration}
                  </span>
                </div>

                <p className={styles.priceHint}>Final price depends on the barber you choose.</p>

                <div className="card-actions">
                  <button
                    onClick={() => handleBookService(service)}
                    className="card-button"
                    aria-label={`Choose a barber for ${service.name}`}
                  >
                    Choose Barber
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaSection}>
          <h2>Need Help Choosing a Service?</h2>
          <p>Contact us for personalized recommendations</p>
          <div className={styles.ctaButtons}>
            <a
              href={whatsappUrl}
              className="card-button"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact us via WhatsApp"
            >
              WhatsApp Consultation
            </a>
            <a
              href={`tel:${businessPhone.replace(/\s+/g, '')}`}
              className="card-button secondary"
              aria-label={`Call us at ${businessPhone}`}
            >
              Call Us Now
            </a>
          </div>
        </div>
      </div>

      {selectedService ? (
        <BookingFlowModal
          service={selectedService}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedService(null)
          }}
        />
      ) : null}
    </SitePageBackground>
  )
}
