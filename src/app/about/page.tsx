'use client'

import Link from 'next/link'
import styles from './about.module.css'

export default function AboutPage() {
  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">About Only Bangers</h1>
          <p className="page-subtitle">Every cut tells a story</p>
        </div>

        <div className={styles.aboutContainer}>
          {/* Bedroom Beginning Section */}
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>The Bedroom Beginning</h2>
            <p className={styles.sectionText}>
              Only Bangers wasn't born in a boardroom. It was born in my bedroom—Antonio Prince's bedroom—where the four walls felt both like a prison and a canvas.
            </p>
            <p className={styles.sectionText}>
              Unemployment has a peculiar weight. It doesn't just sit on your shoulders; it settles in your bones. For months, I carried it. But in that quiet space, between job applications and fading hope, a different kind of vision started to form.
            </p>
            <div className={styles.quote}>
              <p>
                "What if a barber's value wasn't just in the hands that hold the scissors, but in the eyes that watch the art?"
              </p>
            </div>
            <p className={styles.sectionText}>
              I looked at the barbers in my community—artists in their own right—and saw a broken system. Talented hands, but invisible work. Masterful cuts, but no audience. Local legends with no way to become global inspirations.
            </p>
          </section>

          {/* Philosophy Section */}
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>The Only Bangers Philosophy</h2>
            <div className={styles.philosophyGrid}>
              <div className={styles.philosophyCard}>
                <h3 className={styles.philosophyCardTitle}>The Radical Truth</h3>
                <p className={styles.philosophyCardText}>
                  A barber is only as valuable as their least impressive cut. Harsh? Perhaps. True? Absolutely.
                </p>
                <p className={styles.philosophyCardText}>
                  In the age of visibility, your worst work defines you more than your best.
                </p>
              </div>
              <div className={styles.philosophyCard}>
                <h3 className={styles.philosophyCardTitle}>The New Economy of Attention</h3>
                <p className={styles.philosophyCardText}>
                  Your cut's value = how many people see it × how many are inspired by it.
                </p>
                <p className={styles.philosophyCardText}>
                  Not just a transaction. A broadcast. Not just a service. A performance. Not just a haircut. A story.
                </p>
              </div>
            </div>
            <p className={styles.philosophyAltText}>
              We don't book appointments. We curate audiences.
            </p>
          </section>

          {/* Mission Section */}
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>Our Mission: Content as Currency</h2>
            <p className={styles.sectionText}>
              Only Bangers is more than a booking platform. It's an ecosystem where every snip of the scissors is potentially a viral moment. Where every fade has the chance to trend. Where barbers don't just build clientele—they build followings.
            </p>
            <div className={styles.missionGrid}>
              <div className={styles.missionCard}>
                <div className={styles.missionIcon}>🎥</div>
                <h4 className={styles.missionCardTitle}>Video-First Booking</h4>
                <p className={styles.missionCardText}>Every appointment includes tools to capture, edit, and share the transformation</p>
              </div>
              <div className={styles.missionCard}>
                <div className={styles.missionIcon}>📈</div>
                <h4 className={styles.missionCardTitle}>Skill Amplification</h4>
                <p className={styles.missionCardText}>Your work reaches beyond the barber chair to inspire the next generation</p>
              </div>
              <div className={styles.missionCard}>
                <div className={styles.missionIcon}>🤝</div>
                <h4 className={styles.missionCardTitle}>Community Valuation</h4>
                <p className={styles.missionCardText}>Your value grows with every view, like, and share of your craft</p>
              </div>
            </div>
            <p className={styles.sectionText}>
              From my bedroom to your barber chair, we're rewriting what it means to be a barber in the digital age. Your hands were made for more than just cutting hair. They were made for creating movements.
            </p>
          </section>

          {/* Founder Section */}
          <section className={styles.founderSection}>
            <div className={styles.founderImage}>
              <img
                src="/images/antonio-prince.jpg"
                alt="Antonio Prince - Founder of Only Bangers"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/header-bg.png'
                }}
              />
            </div>
            <h3 className={styles.founderName}>Antonio Prince</h3>
            <p className={styles.founderTitle}>
              Founder, Only Bangers<br />
              <span className={styles.founderSubtitle}>Formerly unemployed visionary. Currently building the future of barbering.</span>
            </p>
            <div className={styles.founderQuote}>
              <p>
                "Your next cut shouldn't just change someone's look.<br />
                It should change someone's life. Starting with yours."
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <Link href="/services" className={styles.ctaButton}>
              Book Your First Content-Cut
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}