export interface Service {
  id: string
  name: string
  description: string
  duration: string
  price: string
  category: string
}

export const services: Service[] = [
  {
    id: 'classic-cut',
    name: 'Classic Cut',
    description: 'Traditional haircut with clippers and scissors, finished with a hot towel.',
    duration: '30 min',
    price: 'R150',
    category: 'hair',
  },
  {
    id: 'fade',
    name: 'Fade',
    description: 'Precision fade from skin to longer hair, tailored to your style.',
    duration: '45 min',
    price: 'R200',
    category: 'hair',
  },
  {
    id: 'beard-trim',
    name: 'Beard Trim',
    description: 'Shape, trim, and line up your beard with hot towel treatment.',
    duration: '20 min',
    price: 'R100',
    category: 'beard',
  },
  {
    id: 'hot-towel-shave',
    name: 'Hot Towel Shave',
    description: 'Traditional straight razor shave with hot towels and soothing aftershave.',
    duration: '40 min',
    price: 'R180',
    category: 'beard',
  },
  {
    id: 'hair-beard',
    name: 'Hair + Beard Combo',
    description: 'Complete grooming experience with haircut and beard trim.',
    duration: '60 min',
    price: 'R300',
    category: 'combo',
  },
  {
    id: 'kids-cut',
    name: 'Kids Cut',
    description: 'Fun, friendly haircut for children under 12.',
    duration: '20 min',
    price: 'R120',
    category: 'hair',
  },
]