'use client'

import { useEffect, useState } from 'react'
import BookingFlowModal from '@/components/BookingFlowModal'
import { readBookingDraft } from '@/lib/bookings/draft'
import { services } from '@/data/services'
import styles from './services.module.css'

type ServiceCard = {
  id: string
  name: string
  price: number
  duration: string
  description: string
  image: string
}

const serviceCards: ServiceCard[] = services.map((service) => ({
  id: service.id,
  name: service.name,
  price: Number.parseInt(service.price.replace(/[^\d]/g, ''), 10),
  duration: service.duration,
  description: service.description,
  image: '/images/header-bg.png',
}))

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

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
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Our Services</h1>
          <p className="page-subtitle">Premium barber services with expert craftsmanship</p>
        </div>

        <div className="services-grid">
          {serviceCards.map((service) => (
            <div key={service.id} className="service-card">
              <div className="image-container-card">
                <div className="image-placeholder">
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
              </div>
              
              <div className="card-content">
                <h3 className="card-title">{service.name}</h3>
                <p className="card-description">{service.description}</p>
                
                <div className="card-details">
                  <span className="card-price">R{service.price}</span>
                  <span className="card-duration" aria-label={`Duration: ${service.duration}`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.duration}
                  </span>
                </div>
                
                <div className="card-actions">
                  <button
                    onClick={() => handleBookService(service)}
                    className="card-button"
                    aria-label={`Book ${service.name} service`}
                  >
                    Book Now
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
              href="https://wa.me/27699864730" 
              className="card-button" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Contact us via WhatsApp"
            >
              WhatsApp Consultation
            </a>
            <a 
              href="tel:+27699864730" 
              className="card-button secondary"
              aria-label="Call us at +27 69 986 4730"
            >
              Call Us Now
            </a>
          </div>
        </div>
      </div>

      {selectedService && (
        <BookingFlowModal
          service={selectedService}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedService(null)
          }}
        />
      )}
    </div>
  )
}
