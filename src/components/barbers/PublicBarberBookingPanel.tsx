'use client'

import { useState } from 'react'
import BookingFlowModal from '@/components/BookingFlowModal'
import { getSafeImage } from '@/lib/safe-image'

type ServiceCard = {
  id: string
  name: string
  description: string
  durationLabel: string
  price: number
}

export function PublicBarberBookingPanel({
  barberUserId,
  barberName,
  services,
}: {
  barberUserId: string
  barberName: string
  services: ServiceCard[]
}) {
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null)

  return (
    <>
      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="card-content">
              <h3 className="card-title">{service.name}</h3>
              <p className="card-description">{service.description}</p>
              <div className="card-details">
                <span className="card-price">R{service.price}</span>
                <span className="card-duration">{service.durationLabel}</span>
              </div>
              <div className="card-actions">
                <button className="card-button" onClick={() => setSelectedService(service)}>
                  Book with {barberName}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedService ? (
        <BookingFlowModal
          service={{
            id: selectedService.id,
            name: selectedService.name,
            description: selectedService.description,
            duration: selectedService.durationLabel,
            image: getSafeImage(null),
            price: selectedService.price,
          }}
          preferredBarberUserId={barberUserId}
          isOpen={selectedService !== null}
          onClose={() => setSelectedService(null)}
        />
      ) : null}
    </>
  )
}
