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
    image: '/images/antonio-prince.jpg',
  },
  {
    id: 2,
    name: 'Michael Johnson',
    specialty: 'Fade Specialist',
    image: '/images/barber-placeholder.jpg',
  },
  {
    id: 3,
    name: 'David Williams',
    specialty: 'Beard Expert',
    image: '/images/barber-placeholder.jpg',
  },
]

export function getAvailableTimes(_barberId: number, _date: string): string[] {
  return []
}

export function isDateAvailable(date: string): boolean {
  return !Number.isNaN(new Date(date).getTime())
}
