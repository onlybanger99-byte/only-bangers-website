import { BRAND_ASSETS } from '@/lib/brand-assets'

export interface Barber {
  id: number
  name: string
  specialty: string
  image: string
}

export const barbers: Barber[] = [
  {
    id: 1,
    name: 'Antonio Prince',
    specialty: 'Founder & Lead Barber',
    image: BRAND_ASSETS.hero,
  },
  {
    id: 2,
    name: 'Michael Johnson',
    specialty: 'Fade Specialist',
    image: BRAND_ASSETS.logoColour,
  },
  {
    id: 3,
    name: 'David Williams',
    specialty: 'Beard Expert',
    image: BRAND_ASSETS.logoColour,
  },
]

export function getAvailableTimes(_barberId: number, _date: string): string[] {
  return []
}

export function isDateAvailable(date: string): boolean {
  return !Number.isNaN(new Date(date).getTime())
}
