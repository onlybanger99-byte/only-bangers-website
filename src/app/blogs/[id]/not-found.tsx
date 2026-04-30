import Link from 'next/link'
import styles from '../blogs.module.css'

export default function BlogNotFound() {
  return (
    <div className={styles.blogsContainer}>
      <section className={styles.blogsHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>ARTICLE NOT FOUND</h1>
          <p className={styles.subtitle}>
            That blog entry does not exist or is no longer available.
          </p>
          <Link href="/blogs" className={styles.readMore}>
            Return to Blogs
          </Link>
        </div>
      </section>
    </div>
  )
}
