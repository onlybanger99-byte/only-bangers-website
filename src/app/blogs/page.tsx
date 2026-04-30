'use client'

import Link from 'next/link'
import { blogPosts } from '@/data/blog-posts'
import styles from './blogs.module.css'

export default function BlogsPage() {
  return (
    <div className={styles.blogsContainer}>
      <section className={styles.blogsHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>BARBER & CREATOR INSIGHTS</h1>
          <p className={styles.subtitle}>
            Professional tips, techniques, and stories from the world of premium barbering and
            content creation
          </p>
        </div>
      </section>

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
                    Read More {'>'}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.newsletterSection}>
        <div className={styles.newsletterCard}>
          <h2 className={styles.newsletterTitle}>STAY UPDATED</h2>
          <p className={styles.newsletterSubtitle}>
            Subscribe to get weekly insights on barbering techniques, content creation, and
            industry trends
          </p>

          <form className={styles.newsletterForm} onSubmit={(event) => event.preventDefault()}>
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

          <p className={styles.privacyNote}>We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </section>
    </div>
  )
}
