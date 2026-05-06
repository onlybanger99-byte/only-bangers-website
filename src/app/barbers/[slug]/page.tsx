import { notFound } from 'next/navigation'
import { PublicBarberImage } from '@/components/barbers/PublicBarberImage'
import { PublicBarberAvailabilityCalendar } from '@/components/barbers/PublicBarberAvailabilityCalendar'
import { PublicBarberBookingPanel } from '@/components/barbers/PublicBarberBookingPanel'
import { SitePageBackground } from '@/components/site/SitePageBackground'
import { formatDate } from '@/lib/date-time'
import { getBarberProfileBySlug } from '@/lib/barbers/service'
import { getSiteContentMap } from '@/lib/site-content/service'
import { getSiteImage } from '@/lib/site-content/public'
import { getSafeImage } from '@/lib/safe-image'

export default async function BarberDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getBarberProfileBySlug(slug)
  const contentMap = await getSiteContentMap()
  const defaultBarberAvatar = getSiteImage(contentMap, 'default_barber_avatar')

  if (!data) {
    notFound()
  }

  const locationLabel = data.barber.cutting_location || data.barber.location || 'Location not set'
  const mapHref =
    data.barber.map_url ||
    (data.barber.latitude != null && data.barber.longitude != null
      ? `https://www.google.com/maps?q=${data.barber.latitude},${data.barber.longitude}`
      : null)

  return (
    <SitePageBackground backgroundKeys={['global_page_background', 'site_background_image']}>
      <div className="main-content">
        <div className="service-card" style={{ marginBottom: 24 }}>
          <div className="card-content">
            <PublicBarberImage
              src={data.barber.profile_image_url || defaultBarberAvatar}
              name={data.barber.display_name}
              alt={data.barber.display_name}
              style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 20, marginBottom: 20 }}
            />
            <h1 className="page-title" style={{ textAlign: 'left', marginBottom: 8 }}>{data.barber.display_name}</h1>
            <p className="page-subtitle" style={{ textAlign: 'left', marginBottom: 16 }}>{data.barber.bio}</p>
            <div className="card-details">
              <span className="card-duration">{locationLabel}</span>
              <span className="card-price">
                {data.reviews.averageRating != null ? `${data.reviews.averageRating.toFixed(1)} / 5` : 'No reviews yet'}
              </span>
            </div>
            {mapHref ? (
              <p className="card-description">
                <a href={mapHref} target="_blank" rel="noreferrer" className="card-button secondary">
                  Open in Maps
                </a>
              </p>
            ) : (
              <p className="card-description">Map not available yet.</p>
            )}
            {data.barber.latitude != null && data.barber.longitude != null ? (
              <iframe
                title={`${data.barber.display_name} location map`}
                src={`https://www.google.com/maps?q=${data.barber.latitude},${data.barber.longitude}&z=15&output=embed`}
                style={{ width: '100%', minHeight: 260, border: 0, borderRadius: 18, marginTop: 16 }}
                loading="lazy"
              />
            ) : null}
          </div>
        </div>

        <section style={{ marginBottom: 28 }}>
          <div className="page-header">
            <h2 className="page-title">Services & Prices</h2>
            <p className="page-subtitle">Book this barber using their current live prices.</p>
          </div>
          <PublicBarberBookingPanel
            barberUserId={data.barber.id}
            barberName={data.barber.display_name}
            services={data.servicePrices.map((price) => ({
              id: price.serviceId ?? price.id,
              name: price.serviceName,
              description: `Book ${price.serviceName} with ${data.barber.display_name}.`,
              durationLabel: price.durationMinutes ? `${price.durationMinutes} min` : 'Duration not set',
              price: price.price,
            }))}
          />
        </section>

        <section style={{ marginBottom: 28 }}>
          <div className="page-header">
            <h2 className="page-title">Availability Calendar</h2>
            <p className="page-subtitle">Highlighted dates reflect live bookable time slots after current bookings are filtered out.</p>
          </div>
          {data.servicePrices.length > 0 ? (
            <PublicBarberAvailabilityCalendar
              barberUserId={data.barber.id}
              services={data.servicePrices.map((price) => ({
                id: price.id,
                label: price.serviceName,
              }))}
            />
          ) : (
            <div className="service-card">
              <div className="card-content">
                <h3 className="card-title">No live services yet</h3>
                <p className="card-description">Availability will appear here as soon as this barber publishes live pricing.</p>
              </div>
            </div>
          )}
        </section>

        <section style={{ marginBottom: 28 }}>
          <div className="page-header">
            <h2 className="page-title">Work Gallery</h2>
            <p className="page-subtitle">A few examples of this barber’s recent work.</p>
          </div>
          <div className="services-grid">
            {data.gallery.length > 0 ? (
              data.gallery.map((image) => (
                <article key={image.id} className="service-card">
                  <div className="card-content">
                    <img
                      src={getSafeImage(image.imageUrl)}
                      alt={image.caption ?? `${data.barber.display_name} gallery image`}
                      style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 18, marginBottom: 14 }}
                    />
                    <p className="card-description">{image.caption ?? 'Only Bangers work gallery image.'}</p>
                  </div>
                </article>
              ))
            ) : (
              <article className="service-card">
                <div className="card-content">
                  <h3 className="card-title">Gallery coming soon</h3>
                  <p className="card-description">This barber has not published work images yet.</p>
                </div>
              </article>
            )}
          </div>
        </section>

        <section style={{ marginBottom: 28 }}>
          <div className="page-header">
            <h2 className="page-title">Reviews</h2>
            <p className="page-subtitle">Recent customer feedback.</p>
          </div>
          <div className="services-grid">
            {data.reviews.recentReviews.length > 0 ? (
              data.reviews.recentReviews.map((review) => (
                <article key={review.id} className="service-card">
                  <div className="card-content">
                    <h3 className="card-title">{review.rating} / 5</h3>
                    <p className="card-description">{review.comment ?? 'Customer left a rating without a comment.'}</p>
                    <p className="card-description">{formatDate(review.createdAt)}</p>
                  </div>
                </article>
              ))
            ) : (
              <article className="service-card">
                <div className="card-content">
                  <h3 className="card-title">No visible reviews yet</h3>
                  <p className="card-description">Public reviews will appear here once customers start leaving feedback.</p>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </SitePageBackground>
  )
}
