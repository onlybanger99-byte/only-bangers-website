import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBlogPostById } from '@/data/blog-posts'
import styles from '../blogs.module.css'

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = getBlogPostById(id)

  if (!post) {
    notFound()
  }

  return (
    <div className={styles.blogsContainer}>
      <section className={styles.blogsHeader}>
        <div className={styles.headerContent}>
          <p className={styles.category}>{post.category}</p>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.subtitle}>
            {post.date} · {post.readTime}
          </p>
        </div>
      </section>

      <section className={styles.blogsSection}>
        <article className={styles.newsletterCard}>
          <p className={styles.blogExcerpt}>{post.excerpt}</p>
          {post.body.map((paragraph) => (
            <p key={paragraph} className={styles.privacyNote}>
              {paragraph}
            </p>
          ))}

          <Link href="/blogs" className={styles.readMore}>
            Back to Blogs
          </Link>
        </article>
      </section>
    </div>
  )
}
