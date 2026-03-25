'use client'

import { useState } from 'react'
import BookingFlowModal from '@/components/BookingFlowModal'

export default function ServicesPage() {
  const services = [
    { id: '1', name: 'Classic Precision Cut', price: 180, duration: '45 min', description: 'Expert haircut with precision styling', image: '/images/classic-cut.jpg' },
    { id: '2', name: 'Premium Beard Trim', price: 120, duration: '30 min', description: 'Professional beard shaping and grooming', image: '/images/beard-trim.jpg' },
    { id: '3', name: 'Signature Haircut & Beard', price: 250, duration: '60 min', description: 'Complete grooming package', image: '/images/signature-cut.jpg' },
    { id: '4', name: 'Royal Shave', price: 150, duration: '40 min', description: 'Traditional hot towel shave', image: '/images/royal-shave.jpg' },
    { id: '5', name: 'Hair Treatment', price: 200, duration: '50 min', description: 'Deep conditioning and repair treatment', image: '/images/hair-treatment.jpg' },
    { id: '6', name: 'Kids Cut', price: 140, duration: '35 min', description: 'Specialized haircut for children', image: '/images/kids-cut.jpg' },
  ]

  const [selectedService, setSelectedService] = useState<any>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const handleBookService = (service: any) => {
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
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="image-container-card">
                <div className="image-placeholder">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
              </div>
              
              <div className="card-content">
                <h3 className="card-title">{service.name}</h3>
                <p className="card-description">{service.description}</p>
                
                <div className="card-details">
                  <span className="card-price">R{service.price}</span>
                  <span className="card-duration">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.duration}
                  </span>
                </div>
                
                <div className="card-actions">
                  <button
                    onClick={() => handleBookService(service)}
                    className="card-button"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cta-section">
          <h2>Need Help Choosing a Service?</h2>
          <p>Contact us for personalized recommendations</p>
          <div className="cta-buttons">
            <a href="https://wa.me/27699864730" className="card-button" target="_blank" rel="noopener noreferrer">
              WhatsApp Consultation
            </a>
            <a href="tel:+27699864730" className="card-button secondary">
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