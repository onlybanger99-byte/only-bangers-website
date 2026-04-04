'use client'

import Link from 'next/link'
import styles from './blogs.module.css'

export default function BlogsPage() {
  const blogPosts = [
    {
      id: 1,
      title: 'The Art of the Perfect Fade: Techniques That Work',
      excerpt: 'Master the fundamental techniques used by professional barbers to create the perfect fade every time.',
      category: 'Techniques',
      readTime: '5 min read',
      date: 'March 28, 2026'
    },
    {
      id: 2,
      title: 'Creating Content That Goes Viral: Hair Edition',
      excerpt: 'Learn how to capture the best angles and lighting for barbershop content that resonates with your audience.',
      category: 'Content Creation',
      readTime: '7 min read',
      date: 'March 25, 2026'
    },
    {
      id: 3,
      title: 'Beard Care 101: Maintenance Tips from the Pros',
      excerpt: 'A comprehensive guide to maintaining a healthy, stylish beard with expert grooming tips.',
      category: 'Grooming',
      readTime: '6 min read',
      date: 'March 22, 2026'
    },
    {
      id: 4,
      title: 'Building Your Personal Brand as a Creator',
      excerpt: 'Discover strategies for growing your social media presence through authentic barbershop content.',
      category: 'Personal Branding',
      readTime: '8 min read',
      date: 'March 18, 2026'
    },
    {
      id: 5,
      title: 'Barber Shop Design Trends 2026',
      excerpt: 'Explore modern aesthetic approaches that create the perfect environment for client transformation.',
      category: 'Design',
      readTime: '6 min read',
      date: 'March 15, 2026'
    },
    {
      id: 6,
      title: 'Why Professional Recording Changes Everything',
      excerpt: 'The impact of high-quality video production on client satisfaction and content performance.',
      category: 'Industry Insights',
      readTime: '7 min read',
      date: 'March 12, 2026'
    }
  ]

  return (
    <div className={styles.blogsContainer}>
      {/* Header */}
      <section className={styles.blogsHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>BARBER & CREATOR INSIGHTS</h1>
          <p className={styles.subtitle}>
            Professional tips, techniques, and stories from the world of premium barbering and content creation
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className={styles.blogsSection}>
        <div className={styles.blogGrid}>
          {blogPosts.map((post) => (
            <article key={post.id} className={styles.blogCard}>
              <div className={styles.blogImage}></div>
              
              <div className={styles.blogContent}>
                <div className={styles.blogMeta}>
                  <span className={styles.category}>{post.category}</span>
                  <span className={styles.readTime}>{post.readTime}</span>
                </div>
                
                <h2 className={styles.blogTitle}>{post.title}</h2>
                <p className={styles.blogExcerpt}>{post.excerpt}</p>
                
                <div className={styles.blogFooter}>
                  <span className={styles.date}>{post.date}</span>
                  <Link href={`/blogs/${post.id}`} className={styles.readMore}>
                    Read More →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className={styles.newsletterSection}>
        <div className={styles.newsletterCard}>
          <h2 className={styles.newsletterTitle}>STAY UPDATED</h2>
          <p className={styles.newsletterSubtitle}>
            Subscribe to get weekly insights on barbering techniques, content creation, and industry trends
          </p>
          
          <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className={styles.emailInput}
              required
            />
            <button type="submit" className={styles.subscribeButton}>
              SUBSCRIBE
            </button>
          </form>
          
          <p className={styles.privacyNote}>
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  )
}
