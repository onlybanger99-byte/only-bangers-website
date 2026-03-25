// src/app/page.tsx - CONVERSION-FOCUSED VERSION
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

export default function HomePage() {
  const processSectionRef = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated) {
            setAnimated(true)
          }
        })
      },
      { threshold: 0.2 }
    )

    if (processSectionRef.current) {
      observer.observe(processSectionRef.current)
    }

    return () => observer.disconnect()
  }, [animated])

  // Featured barber - Antonio Prince
  const featuredBarber = {
    name: 'ANTONIO PRINCE',
    specialty: 'FOUNDER & LEAD BARBER',
    instagram: '@only_bangers_',
    bookingLink: 'https://calendly.com/onlybangers',
    featuredContent: '15+ years experience, content creation specialist'
  }

  // How it works with images
  const howItWorks = [
    {
      step: '01',
      title: 'BOOK A RECORDED CUT',
      description: 'Reserve your slot for a haircut designed for content creation',
      image: 'book-cut.jpg'
    },
    {
      step: '02',
      title: 'GET FILMED IN 4K',
      description: 'Professional recording of your transformation from multiple angles',
      image: 'record-cut.jpg'
    },
    {
      step: '03',
      title: 'RECEIVE YOUR FOOTAGE',
      description: 'Get all raw footage to edit and post on your channels',
      image: 'receive-footage.jpg'
    },
    {
      step: '04',
      title: 'GET FEATURED & EARN',
      description: '50% off next cut when you post and tag us. Top content gets featured',
      image: 'get-featured.jpg'
    }
  ]

  // This week's features with images
  const weeklyFeatures = [
    {
      id: 1,
      title: 'FADE TRANSFORMATION',
      creator: '@marcus_stylez',
      image: 'feature-fade.jpg',
      views: '25K'
    },
    {
      id: 2,
      title: 'BEARD SCULPT REEL',
      creator: '@beardkingleo',
      image: 'feature-beard.jpg',
      views: '42K'
    },
    {
      id: 3,
      title: 'GLOW-UP SERIES',
      creator: '@stylejourney',
      image: 'feature-glowup.jpg',
      views: '68K'
    }
  ]

  return (
    <div className={styles.homepageContainer}>
      {/* HERO: Join the Vibe */}
      <section className={styles.heroSection}>
        <div className={`${styles.contentCard} ${styles.heroCard}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>WELCOME TO THE VIBE</div>
            <h1 className={styles.heroTitle}>
              GET YOUR CUT RECORDED<br />
              GET <span className={styles.highlight}>FEATURED</span><br />
              GET <span className={styles.highlight}>50% OFF</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Book a recorded haircut with our content specialists. Receive professional footage, 
              post for your audience, and get 50% off your next cut when you tag us.
            </p>
            
            <div className={styles.heroCta}>
              <a 
                href="https://calendly.com/onlybangers" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.primaryButton}
              >
                BOOK RECORDED CUT
              </a>
              <a 
                href="#creators" 
                className={styles.secondaryButton}
              >
                SEE SUCCESS STORIES
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Barber */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>OUR BARBER CREATOR</h2>
          <p className={styles.sectionSubtitle}>Work with a content creation specialist</p>
        </div>
        
        <div className={styles.barberContainer}>
          <div className={`${styles.contentCard} ${styles.barberCard}`}>
            <div className={styles.barberHeader}>
              <h3 className={styles.barberName}>{featuredBarber.name}</h3>
              <span className={styles.barberSpecialty}>{featuredBarber.specialty}</span>
            </div>
            
            <div className={styles.barberContent}>
              <p className={styles.barberInstagram}>{featuredBarber.instagram}</p>
              <p className={styles.barberFeature}>{featuredBarber.featuredContent}</p>
              <p className={styles.barberExpertise}>
                Specializes in creating viral haircut content with proven track record of 
                helping clients grow their social media through professional barbering footage.
              </p>
            </div>
            
            <div className={styles.barberActions}>
              <a 
                href={featuredBarber.bookingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.barberButton}
              >
                BOOK WITH ANTONIO
              </a>
              <a 
                href="https://www.instagram.com/only_bangers_"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.barberLink}
              >
                VIEW PORTFOLIO
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - With Animations */}
      <section ref={processSectionRef} className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>HOW TO GET FEATURED</h2>
          <p className={styles.sectionSubtitle}>Your path to viral content and discounts</p>
        </div>
        
        <div className={`${styles.processContainer} ${animated ? styles.animated : ''}`}>
          {howItWorks.map((step, index) => (
            <div 
              key={step.step} 
              className={`${styles.contentCard} ${styles.processCard} ${styles[`processCard${index + 1}`]}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={styles.processStep}>{step.step}</div>
              <h3 className={styles.processTitle}>{step.title}</h3>
              <p className={styles.processDescription}>{step.description}</p>
              <div className={styles.processImage}></div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Creators - Conversion Point */}
      <section id="creators" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>FEATURED CREATORS</h2>
          <p className={styles.sectionSubtitle}>Clients who turned recorded cuts into viral content</p>
        </div>
        
        <div className={styles.conversionCard}>
          <div className={styles.conversionContent}>
            <h3 className={styles.conversionTitle}>YOUR CONTENT COULD BE HERE</h3>
            <p className={styles.conversionSubtitle}>
              Every week, we feature the best content from our recorded cuts on our Instagram 
              with over 50K followers.
            </p>
            
            <div className={styles.conversionStats}>
              <div className={styles.stat}>
                <div className={styles.statNumber}>50%</div>
                <div className={styles.statLabel}>OFF NEXT CUT</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>4K</div>
                <div className={styles.statLabel}>PRO FOOTAGE</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>24H</div>
                <div className={styles.statLabel}>DELIVERY TIME</div>
              </div>
            </div>
            
            <div className={styles.conversionCta}>
              <a 
                href="https://calendly.com/onlybangers" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.primaryButton}
              >
                BOOK YOUR RECORDED CUT
              </a>
              <p className={styles.conversionNote}>
                Limited slots available. Book now to secure your content creation session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Feature Wall */}
      <section className={styles.section}>
        <div className={`${styles.contentCard} ${styles.featureWallCard}`}>
          <div className={styles.featureWallHeader}>
            <h2 className={styles.featureWallTitle}>THIS WEEK'S FEATURES</h2>
            <p className={styles.featureWallSubtitle}>Real content from recorded cuts</p>
          </div>
          
          <div className={styles.featureWallGrid}>
            {weeklyFeatures.map((feature) => (
              <div key={feature.id} className={styles.featureCard}>
                <div className={styles.featureImage}></div>
                <div className={styles.featureInfo}>
                  <h4 className={styles.featureTitle}>{feature.title}</h4>
                  <p className={styles.featureCreator}>by {feature.creator}</p>
                  <p className={styles.featureViews}>{feature.views} views</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.featureWallCta}>
            <a 
              href="https://www.instagram.com/only_bangers99" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.primaryButton}
            >
              SEE LIVE FEATURES ON INSTAGRAM
            </a>
            <p className={styles.featureWallNote}>
              Follow us to see weekly features and get inspired for your own content.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.section}>
        <div className={`${styles.contentCard} ${styles.finalCtaCard}`}>
          <div className={styles.finalCtaContent}>
            <h2 className={styles.finalCtaTitle}>READY TO CREATE VIRAL CONTENT?</h2>
            <p className={styles.finalCtaText}>
              Book your recorded cut today. Get professional footage, grow your audience, 
              and get 50% off your next cut when you post and tag us.
            </p>
            
            <div className={styles.finalCtaActions}>
              <a 
                href="https://calendly.com/onlybangers" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.primaryButton}
              >
                BOOK NOW
              </a>
              <a 
                href="https://www.instagram.com/only_bangers99"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryButton}
              >
                SEE EXAMPLES
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}