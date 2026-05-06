import Link from 'next/link'
import { PublicBarberImage } from '@/components/barbers/PublicBarberImage'
import { SitePageBackground } from '@/components/site/SitePageBackground'
import { listPublicBarberDirectoryCards } from '@/lib/barbers/service'
import { getSiteContentMap } from '@/lib/site-content/service'
import { getSiteImage } from '@/lib/site-content/public'

function ratingLabel(averageRating: number | null, reviewCount: number) {
  if (averageRating == null || reviewCount === 0) {
    return 'No reviews yet'
  }

  return `${averageRating.toFixed(1)} / 5 (${reviewCount})`
}

export default async function PublicBarbersPage() {
  const barbers = await listPublicBarberDirectoryCards()
  const contentMap = await getSiteContentMap()
  const defaultBarberAvatar = getSiteImage(contentMap, 'default_barber_avatar')

  return (
    <SitePageBackground backgroundKeys={['global_page_background', 'site_background_image']}>
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Live Barbers</h1>
          <p className="page-subtitle">Discover live Only Bangers barbers, compare starting prices, and book the right chair for your next cut.</p>
        </div>

        {barbers.length > 0 ? (
          <div className="services-grid">
            {barbers.map((barber) => (
              <article key={barber.id} className="service-card">
                <div className="card-content">
                  <PublicBarberImage
                    src={barber.profile_image_url || defaultBarberAvatar}
                    name={barber.display_name}
                    alt={barber.display_name}
                    style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 18, marginBottom: 18 }}
                  />
                  <h2 className="card-title">{barber.display_name}</h2>
                  <p className="card-description">{barber.bio}</p>
                  <div className="card-details">
                    <span className="card-price">{barber.startingPrice != null ? `From R${barber.startingPrice}` : 'Prices vary by barber'}</span>
                    <span className="card-duration">{barber.cutting_location || barber.location || 'Location not set'}</span>
                  </div>
                  <p className="card-description">{ratingLabel(barber.averageRating, barber.reviewCount)}</p>
                  <div className="card-actions">
                    <Link href={`/barbers/${barber.slug}`} className="card-button secondary">
                      View Barber
                    </Link>
                    <Link href={`/barbers/${barber.slug}`} className="card-button">
                      Book
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="service-card">
            <div className="card-content">
              <h2 className="card-title">No live barbers yet</h2>
              <p className="card-description">Approved live barber pages will appear here as soon as go-live requests are approved.</p>
            </div>
          </div>
        )}
      </div>
    </SitePageBackground>
  )
}
