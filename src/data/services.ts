export interface Service {
  id: string
  slug: string
  name: string
  description: string
  duration: string
  sortOrder: number
}

export const services: Service[] = [
  {
    id: 'classic-fade',
    slug: 'classic-fade',
    name: 'Classic Fade',
    description: 'A clean, balanced fade finished with sharp detail work and a polished silhouette.',
    duration: '45 min',
    sortOrder: 1,
  },
  {
    id: 'fade-with-dye',
    slug: 'fade-with-dye',
    name: 'Fade with Dye',
    description: 'Precision fade service with colour enhancement for a bold, finished look.',
    duration: '60 min',
    sortOrder: 2,
  },
  {
    id: 'brush-with-trim',
    slug: 'brush-with-trim',
    name: 'Brush with Trim',
    description: 'Shape and refresh your style with a neat trim and brush-focused finish.',
    duration: '35 min',
    sortOrder: 3,
  },
  {
    id: 'beard-trim',
    slug: 'beard-trim',
    name: 'Beard Trim',
    description: 'Line up, shape, and refine your beard for a sharp, well-kept profile.',
    duration: '25 min',
    sortOrder: 4,
  },
  {
    id: 'clean-shave',
    slug: 'clean-shave',
    name: 'Clean Shave',
    description: 'Close, smooth shave service with careful finishing and clean edges.',
    duration: '30 min',
    sortOrder: 5,
  },
  {
    id: 'hair-beard-combo',
    slug: 'hair-beard-combo',
    name: 'Hair & Beard Combo',
    description: 'Full grooming session that pairs a haircut with detailed beard work.',
    duration: '60 min',
    sortOrder: 6,
  },
]
