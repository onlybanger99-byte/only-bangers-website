'use client'

import BookingFlowModal from './BookingFlowModal'
import { getSafeImage } from '@/lib/safe-image'

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
        image: getSafeImage(null),
        description: service.description,
        duration: service.duration,
      }}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}
