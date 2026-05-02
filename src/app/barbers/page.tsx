import Link from 'next/link'
import { listPublicBarberDirectoryCards } from '@/lib/barbers/service'
import { getSafeImage } from '@/lib/safe-image'

function ratingLabel(averageRating: number | null, reviewCount: number) {
  if (averageRating == null || reviewCount === 0) {
    return 'No reviews yet'
  }

  return `${averageRating.toFixed(1)} / 5 (${reviewCount})`
}

export default async function PublicBarbersPage() {
  const barbers = await listPublicBarberDirectoryCards()

  return (
    <div className="page-background">
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
                  <img
                    src={getSafeImage(barber.profile_image_url)}
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
    </div>
  )
}
