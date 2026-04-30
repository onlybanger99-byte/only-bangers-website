export interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  body: string[]
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Art of the Perfect Fade: Techniques That Work',
    excerpt:
      'Master the fundamental techniques used by professional barbers to create the perfect fade every time.',
    category: 'Techniques',
    readTime: '5 min read',
    date: 'March 28, 2026',
    body: [
      'The strongest fade work starts with a clear plan. Section the head properly, decide where the blend should live, and commit to a clean graduation from the first guideline onward.',
      'Consistency matters more than speed. Remove bulk carefully, use lighting to catch weight lines early, and keep stepping back so the shape reads evenly from every angle.',
      'Finishing separates a decent fade from a premium one. Edge work, texture balance, and client-specific detailing are what make the result feel intentional instead of rushed.',
    ],
  },
  {
    id: '2',
    title: 'Creating Content That Goes Viral: Hair Edition',
    excerpt:
      'Learn how to capture the best angles and lighting for barbershop content that resonates with your audience.',
    category: 'Content Creation',
    readTime: '7 min read',
    date: 'March 25, 2026',
    body: [
      'Great barber content begins before the camera rolls. A clean station, strong lighting, and a clear story for the transformation make every edit easier.',
      'Shoot with purpose. Capture the consultation, the key technical moments, the reveal, and the client reaction so the clip feels like a journey instead of disconnected highlights.',
      'The most shareable haircut content feels honest. Viewers respond to confidence, precision, and visible improvement, not just flashy transitions.',
    ],
  },
  {
    id: '3',
    title: 'Beard Care 101: Maintenance Tips from the Pros',
    excerpt:
      'A comprehensive guide to maintaining a healthy, stylish beard with expert grooming tips.',
    category: 'Grooming',
    readTime: '6 min read',
    date: 'March 22, 2026',
    body: [
      'Healthy beard care starts with skin care. Cleanse gently, keep the skin hydrated, and use products that soften the beard without clogging the pores underneath.',
      'Shape should match the client, not the trend cycle. Necklines, cheek lines, and bulk control should all support the face shape and haircut.',
      'Home maintenance works best when the client knows what not to touch. Give simple instructions and protect the structure between appointments.',
    ],
  },
  {
    id: '4',
    title: 'Building Your Personal Brand as a Creator',
    excerpt:
      'Discover strategies for growing your social media presence through authentic barbershop content.',
    category: 'Personal Branding',
    readTime: '8 min read',
    date: 'March 18, 2026',
    body: [
      'A strong personal brand is built through repetition. Your tone, visual style, and service standard should feel recognizable across every platform.',
      'Clients trust creators who teach, show proof of work, and stay consistent. Documenting your process can be more powerful than trying to manufacture hype.',
      'Growth usually follows clarity. When your audience understands what you do and why your work is different, referrals and retention rise together.',
    ],
  },
  {
    id: '5',
    title: 'Barber Shop Design Trends 2026',
    excerpt:
      'Explore modern aesthetic approaches that create the perfect environment for client transformation.',
    category: 'Design',
    readTime: '6 min read',
    date: 'March 15, 2026',
    body: [
      'The best shop design supports workflow first. Beautiful spaces still need clear movement, durable finishes, and stations that help barbers stay efficient.',
      'Atmosphere matters because it shapes confidence. Lighting, texture, music, and scent all contribute to whether the appointment feels premium or forgettable.',
      'Memorable design is usually intentional rather than expensive. A consistent visual identity can make a compact studio feel stronger than a larger but generic space.',
    ],
  },
  {
    id: '6',
    title: 'Why Professional Recording Changes Everything',
    excerpt:
      'The impact of high-quality video production on client satisfaction and content performance.',
    category: 'Industry Insights',
    readTime: '7 min read',
    date: 'March 12, 2026',
    body: [
      'Professional recording helps clients see the value of the work more clearly. Crisp detail, clean sound, and confident pacing elevate the perceived quality of the service.',
      'Better footage also improves marketing efficiency. One strong appointment can turn into reels, story content, portfolio proof, and paid creative assets.',
      'Production quality should serve the cut, not distract from it. The most effective content makes the craftsmanship easier to appreciate.',
    ],
  },
]

export function getBlogPostById(id: string) {
  return blogPosts.find((post) => post.id === id) ?? null
}
