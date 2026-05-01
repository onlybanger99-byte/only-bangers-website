'use client'

import BookingFlowModal from './BookingFlowModal'

interface BookingModalProps {
  service: {
    id: string
    name: string
    price: number
    duration: string
    description: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function BookingModal({ service, isOpen, onClose }: BookingModalProps) {
  return (
    <BookingFlowModal
      service={{
        id: service.id,
        name: service.name,
        price: service.price,
        image: '/images/header-bg.png',
        description: service.description,
        duration: service.duration,
      }}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}
