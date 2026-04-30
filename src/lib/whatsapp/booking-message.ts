function normalizeWhatsappNumber(value: string) {
  return value.replace(/[^\d]/g, '')
}

export interface BookingWhatsappMessageInput {
  customerName: string
  phoneNumber?: string | null
  barberName: string
  serviceName: string
  dateLabel: string
  timeLabel: string
  bookingReference: string
  amountDueLabel: string
}

export function buildBookingWhatsAppMessage(input: BookingWhatsappMessageInput) {
  const lines = [
    'Hi Only Bangers, I would like to confirm my booking payment.',
    `Customer: ${input.customerName}`,
    `Phone: ${input.phoneNumber?.trim() || 'Not provided'}`,
    `Barber: ${input.barberName}`,
    `Service: ${input.serviceName}`,
    `Date: ${input.dateLabel}`,
    `Time: ${input.timeLabel}`,
    `Booking Reference: ${input.bookingReference}`,
    `Amount Due: ${input.amountDueLabel}`,
    'Please send payment proof here so the team can verify and confirm the booking.',
  ]

  return lines.join('\n')
}

export function buildBookingWhatsAppUrl(number: string, message: string) {
  const normalizedNumber = normalizeWhatsappNumber(number)

  if (!normalizedNumber) {
    throw new Error(
      'NEXT_PUBLIC_WHATSAPP_BOOKING_NUMBER is not configured. Add the WhatsApp booking number in international format.'
    )
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`
}
