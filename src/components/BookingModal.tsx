'use client'

import BookingFlowModal from './BookingFlowModal'
import { BRAND_ASSETS } from '@/lib/brand-assets'

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
        image: BRAND_ASSETS.background,
        description: service.description,
        duration: service.duration,
      }}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}
