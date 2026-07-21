'use client'

import { useEffect, useState } from 'react'
import { SitePageBackground } from '@/components/site/SitePageBackground'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getSiteContentImage, getSiteContentValue, getSiteContentVideo, getSiteImage } from '@/lib/site-content/public'
import { BRAND_ASSETS } from '@/lib/brand-assets'
import { getSafeImage } from '@/lib/safe-image'
import styles from './page.module.css'

type OfferKey = 'one-time' | 'committed' | 'loyal'

const PROOF_TILES = [
  {
    eyebrow: '01',
    title: 'Precision in Every Detail',
    text: 'Every cut is shaped with clean lines, careful finishing, and the kind of consistency clients come back for.',
    imageKey: 'home_section_1_image',
    alt: 'Clean skin fade haircut with sharp detailing',
  },
  {
    eyebrow: '02',
    title: 'Premium Grooming Standards',
    text: 'From beard work to final presentation, the experience is built around quality that feels elevated from start to finish.',
    imageKey: 'home_section_2_image',
    alt: 'Premium beard grooming and haircut service',
  },
  {
    eyebrow: '03',
    title: 'Style That Holds Up',
    text: 'Modern cuts, polished finishes, and a tailored approach that keeps your look fresh beyond the chair.',
    imageKey: 'home_section_3_image',
    alt: 'Styled haircut with polished premium finish',
  },
] as const

const OFFER_DETAILS: Record<
  OfferKey,
  {
    title: string
    label: string
    summary: string
    benefits: string[]
    cta: string
  }
> = {
  'one-time': {
    title: 'ONE-TIME',
    label: 'STANDARD RATE',
    summary:
      'Book a single appointment with standard pricing and full access to our barbers.',
    benefits: [
      'Book whenever you want',
      'Expert barber service',
      'No long-term commitment',
      'Standard pricing',
    ],
    cta: 'BOOK NOW',
  },
  committed: {
    title: 'COMMITTED',
    label: 'BEST VALUE',
    summary:
      'Lock in priority booking, preferred pricing, and bonus perks with a commitment to regular appointments.',
    benefits: [
      'Preferred pricing on every cut',
      'Priority booking access',
      'Consistency rewards',
      'Premium experience',
    ],
    cta: 'GET COMMITTED',
  },
  loyal: {
    title: 'LOYAL',
    label: 'ELITE ACCESS',
    summary:
      'Join our VIP tier for the best long-term value, exclusive benefits, and premium treatment.',
    benefits: [
      'Best long-term pricing',
      'VIP booking priority',
      'Exclusive member events',
      'Personal barber relationship',
    ],
    cta: 'JOIN ELITE',
  },
}

const OFFER_CARDS = [
  {
    key: 'one-time' as OfferKey,
    title: 'ONE-TIME',
    label: 'STANDARD',
    points: ['Single visit', 'Full access', 'No commitment'],
  },
  {
    key: 'committed' as OfferKey,
    title: 'COMMITTED',
    label: 'BEST VALUE',
    points: ['Better pricing', 'Priority booking', 'Exclusive perks'],
  },
  {
    key: 'loyal' as OfferKey,
    title: 'LOYAL',
    label: 'ELITE',
    points: ['Premium pricing', 'VIP treatment', 'Member benefits'],
  },
] as const

export default function HomePage() {
  const [activeOffer, setActiveOffer] = useState<OfferKey>('committed')
  const [activeProof, setActiveProof] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const { contentMap } = useSiteContent()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updateMotionPreference()

    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveProof((current) => (current + 1) % PROOF_TILES.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [prefersReducedMotion])

  const proofTiles = PROOF_TILES.map((tile) => ({
    ...tile,
    image: getSiteContentImage(contentMap, tile.imageKey, '') || BRAND_ASSETS.hero,
  }))
  const currentProofTile = proofTiles[activeProof]
  const heroImage =
    getSiteImage(contentMap, ['site_banner_image', 'home_hero_image']) || BRAND_ASSETS.hero
  const heroVideo = getSiteContentVideo(contentMap, 'home_hero_video')
  const ctaImage = getSiteImage(contentMap, 'home_section_7_image')
  const instagramUrl = getSiteContentValue(contentMap, 'footer_instagram_url', 'https://www.instagram.com/only_bangers99')

  const showPreviousProof = () => {
    setActiveProof((current) => (current - 1 + PROOF_TILES.length) % PROOF_TILES.length)
  }

  const showNextProof = () => {
    setActiveProof((current) => (current + 1) % PROOF_TILES.length)
  }

  return (
    <SitePageBackground backgroundKeys={['global_page_background', 'site_background_image', 'home_background_image']}>
      <main className={`main-content ${styles.page}`}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <span className={styles.heroKicker}>Only Bangers Premium Grooming</span>

            <h1 className={styles.heroTitle}>
              Premium Cuts.
              <br />
              Exceptional Service.
            </h1>

            <p className={styles.heroSubtitle}>
              Experience the craft of professional grooming. Whether you&apos;re
              visiting once or becoming a regular, Only Bangers delivers
              precision, style, and premium service.
            </p>

            <div className={styles.heroActions}>
              <a href="/services" className={styles.primaryButton}>
                BOOK APPOINTMENT
              </a>

              <a href="#pricing" className={styles.secondaryButton}>
                VIEW PLANS
              </a>
            </div>
          </div>

            <div className={styles.heroImageFrame}>
              <div className={styles.heroImage}>
                {heroVideo ? (
                  <video autoPlay muted loop playsInline>
                    <source src={heroVideo} />
                  </video>
                ) : (
                  <img
                    src={heroImage}
                    alt="Premium haircut service at Only Bangers"
                  />
                )}
              </div>
            </div>
        </div>
      </section>

      <section className={styles.proofSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose Only Bangers</h2>
          <p className={styles.sectionDescription}>
            Trusted by clients who demand quality, consistency, and a premium
            finish.
          </p>
        </div>

        <div className={styles.proofExperience}>
          <div className={styles.proofStage}>
            <div
              className={styles.proofSlides}
              aria-live={prefersReducedMotion ? 'polite' : 'off'}
            >
                {proofTiles.map((tile, index) => {
                const isActive = index === activeProof

                return (
                  <article
                    key={tile.title}
                    className={`${styles.proofSlide} ${
                      isActive ? styles.proofSlideActive : ''
                    }`}
                    aria-hidden={!isActive}
                  >
                    <img src={tile.image} alt={tile.alt} />
                    <div className={styles.proofOverlay} />
                  </article>
                )
              })}
            </div>

            <div className={styles.proofStageContent}>
              <span className={styles.proofEyebrow}>
                {currentProofTile.eyebrow} / PROOF OF WORK
              </span>
              <h3 className={styles.proofStageTitle}>{currentProofTile.title}</h3>
              <p className={styles.proofStageText}>{currentProofTile.text}</p>

              <div className={styles.proofControls}>
                <button
                  type="button"
                  onClick={showPreviousProof}
                  className={styles.proofArrow}
                  aria-label="Show previous proof image"
                >
                  PREV
                </button>

                <div className={styles.proofIndicators} aria-label="Proof slides">
                  {proofTiles.map((tile, index) => (
                    <button
                      key={tile.title}
                      type="button"
                      onClick={() => setActiveProof(index)}
                      className={`${styles.proofIndicator} ${
                        index === activeProof ? styles.proofIndicatorActive : ''
                      }`}
                      aria-label={`Show ${tile.title}`}
                      aria-pressed={index === activeProof}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={showNextProof}
                  className={styles.proofArrow}
                  aria-label="Show next proof image"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>

          <div className={styles.proofRail}>
            {proofTiles.map((tile, index) => {
              const isActive = index === activeProof

              return (
                <button
                  key={tile.title}
                  type="button"
                  onClick={() => setActiveProof(index)}
                  className={`${styles.proofRailCard} ${
                    isActive ? styles.proofRailCardActive : ''
                  }`}
                  aria-pressed={isActive}
                >
                  <div className={styles.proofRailImage}>
                    <img src={tile.image} alt={tile.alt} />
                  </div>
                  <div className={styles.proofRailCopy}>
                    <span className={styles.proofRailIndex}>{tile.eyebrow}</span>
                    <h3 className={styles.proofRailTitle}>{tile.title}</h3>
                    <p className={styles.proofRailText}>{tile.text}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Choose Your Plan</h2>
          <p className={styles.sectionDescription}>
            Every client is valued. Select the option that works best for you.
          </p>
        </div>

          <div className={styles.offerGrid}>
            {OFFER_CARDS.map((card) => (
              <button
              key={card.key}
              type="button"
              onClick={() => setActiveOffer(card.key)}
              className={`${styles.offerCard} ${
                activeOffer === card.key ? styles.offerCardActive : ''
              }`}
              data-active={activeOffer === card.key}
              >
                <span className={styles.offerBadge}>{card.label}</span>
                <h3 className={styles.offerTitle}>{card.title}</h3>

              <ul className={styles.offerList}>
                {card.points.map((point) => (
                  <li key={point} className={styles.offerListItem}>
                    {point}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className={styles.offerDetail}>
          <h3 className={styles.offerDetailTitle}>
            {OFFER_DETAILS[activeOffer].title}
          </h3>
          <p className={styles.offerDetailLabel}>
            {OFFER_DETAILS[activeOffer].label}
          </p>
          <p className={styles.offerDetailText}>
            {OFFER_DETAILS[activeOffer].summary}
          </p>

          <ul className={styles.offerDetailList}>
            {OFFER_DETAILS[activeOffer].benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>

          <a
            href="/barbers"
            className={styles.primaryButton}
          >
            {OFFER_DETAILS[activeOffer].cta}
          </a>
        </div>
      </section>

      <section className={styles.valueSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Membership Benefits</h2>
          <p className={styles.sectionDescription}>
            Regular clients enjoy exclusive advantages.
          </p>
        </div>

        <div className={styles.valueGrid}>
          <div className={styles.valueCard}>
            <h3 className={styles.valueCardTitle}>Preferred Pricing</h3>
            <p className={styles.valueCardText}>
              Lock in better rates and save with every visit when you commit to
              regular appointments.
            </p>
          </div>

          <div className={styles.valueCard}>
            <h3 className={styles.valueCardTitle}>Priority Booking</h3>
            <p className={styles.valueCardText}>
              Get first access to available time slots and never wait long for
              your scheduled cut.
            </p>
          </div>

          <div className={styles.valueCard}>
            <h3 className={styles.valueCardTitle}>Consistency Rewards</h3>
            <p className={styles.valueCardText}>
              Build a relationship with your barber and receive exclusive perks
              as a loyal member.
            </p>
          </div>

          <div className={styles.valueCard}>
            <h3 className={styles.valueCardTitle}>Premium Experience</h3>
            <p className={styles.valueCardText}>
              VIP treatment, personalized service, and access to exclusive
              member-only events.
            </p>
          </div>
        </div>
      </section>

        <section
          className={styles.ctaSection}
          style={
            ctaImage
              ? {
                  backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.84), rgba(10, 10, 10, 0.9)), url('${ctaImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <h2 className={styles.ctaTitle}>Ready to Experience the Difference?</h2>
          <p className={styles.ctaSubtitle}>
            Book your appointment and discover why clients trust Only Bangers for
            premium grooming.
          </p>

          <div className={styles.ctaActions}>
            <a href="/services" className={styles.primaryButton}>
              SCHEDULE NOW
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryButton}
            >
              FOLLOW US
            </a>
          </div>
        </section>
      </main>
    </SitePageBackground>
  )
}
