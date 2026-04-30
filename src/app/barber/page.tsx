import Link from 'next/link'
import { listPublicBarbers } from '@/lib/barbers/service'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

function toExternalHref(platform: 'instagram' | 'tiktok' | 'facebook' | 'portfolio', value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  const handle = normalized.replace(/^@/, '')

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'tiktok':
      return `https://tiktok.com/@${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'portfolio':
    default:
      return normalized.startsWith('www.') ? `https://${normalized}` : normalized
  }
}

export default async function PublicBarberPage() {
  const barbers = await listPublicBarbers()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroCard}>
          <p className={styles.eyebrow}>Only Bangers Barbers</p>
          <h1 className={styles.title}>Book approved active barbers with confidence</h1>
          <p className={styles.text}>
            Every barber shown here has been approved and activated in the Only Bangers booking flow. Availability depends on each barber.
          </p>
        </section>

        <section className={styles.grid}>
          {barbers.length > 0 ? (
            barbers.map((barber) => (
              <article key={barber.id} className={styles.card}>
                <h2 className={styles.cardTitle}>{barber.display_name}</h2>
                <p className={styles.meta}>{barber.specialty}</p>
                <p className={styles.text}>{barber.bio}</p>
                <div className={styles.badgeRow}>
                  {barber.cutting_location ? <span className={styles.badge}>{barber.cutting_location}</span> : null}
                  <span className={styles.badge}>Choose an available barber and time</span>
                </div>
                <div className={styles.linksRow}>
                  {barber.instagram_url ? (
                    <Link href={toExternalHref('instagram', barber.instagram_url) ?? '#'} className={styles.link}>
                      Instagram
                    </Link>
                  ) : null}
                  {barber.tiktok_url ? (
                    <Link href={toExternalHref('tiktok', barber.tiktok_url) ?? '#'} className={styles.link}>
                      TikTok
                    </Link>
                  ) : null}
                  {barber.facebook_url ? (
                    <Link href={toExternalHref('facebook', barber.facebook_url) ?? '#'} className={styles.link}>
                      Facebook
                    </Link>
                  ) : null}
                  {barber.portfolio_url ? (
                    <Link href={toExternalHref('portfolio', barber.portfolio_url) ?? '#'} className={styles.link}>
                      Portfolio
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>No active barbers yet</h2>
              <p className={styles.text}>
                Approved active barber profiles will appear here as soon as admin completes their review.
              </p>
            </article>
          )}
        </section>
      </div>
    </div>
  )
}
