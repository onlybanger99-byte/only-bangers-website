'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './UniversalFooter.module.css'

export default function UniversalFooter() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [themeSettings, setThemeSettings] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
    setIsAdmin(pathname?.includes('/admin') || false)
    
    const savedTheme = localStorage.getItem('onlyBangersTheme')
    if (savedTheme) {
      try {
        setThemeSettings(JSON.parse(savedTheme))
      } catch (error) {
        console.error('Failed to parse theme settings:', error)
      }
    }
  }, [pathname])

  // Don't show footer on admin login page
  if (pathname === '/admin/login') {
    return null
  }

  const currentYear = new Date().getFullYear()

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.grid}>
            <div className={styles.section}>
              <h3>ONLY BANGERS</h3>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer 
      className={styles.footer} 
      style={{
        background: themeSettings?.primaryColor 
          ? `linear-gradient(to bottom right, ${themeSettings.primaryColor}, ${themeSettings.secondaryColor || themeSettings.primaryColor})`
          : undefined
      }}
    >
      <div className={styles.content}>
        <div className={styles.grid}>
          {/* Brand Section */}
          <div className={styles.section}>
            <h3>
              {themeSettings?.siteTitle?.split(' - ')[0] || 'ONLY BANGERS'}
            </h3>
            <p>
              {themeSettings?.siteDescription || 'Premium haircuts and professional barber services'}
            </p>
            <div className={styles.contactInfo}>
              <a 
                href="https://www.google.com/maps/@-26.3986898,27.8370213,3a,75y,90t/data=!3m7!1e1!3m5!1syZZmHoclcj5_FlBnfSr7PQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DyZZmHoclcj5_FlBnfSr7PQ%26yaw%3D0!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI5MTAyOC4wIKXMDSoASAFQAw%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.contactItem}
                aria-label="View our location"
              >
                <svg className={styles.contactIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                📍 83 Hedera Ave, Extension 2 Ennerdale, Johannesburg, Gauteng 1830
              </a>
              <a href="tel:+27699864730" className={styles.contactItem} aria-label="Call us">
                <svg className={styles.contactIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +27 69 986 4730
              </a>
              <a href="mailto:onlybangers99@gmail.com" className={styles.contactItem} aria-label="Email us">
                <svg className={styles.contactIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                onlybangers99@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h3>Quick Links</h3>
            <div className={styles.links}>
              <Link href="/" className={styles.link}>Home</Link>
              <Link href="/services" className={styles.link}>Services</Link>
              <Link href="/products" className={styles.link}>Products</Link>
              <Link href="/cart" className={styles.link}>Shopping Cart</Link>
              <Link href="/contact" className={styles.link}>Contact Us</Link>
              <Link href="/blogs" className={styles.link}>Blogs</Link>
            </div>
          </div>

          {/* About Section */}
          <div className={styles.section}>
            <h3>About Us</h3>
            <p>Your premier destination for premium barber services. We deliver expert craftsmanship and exceptional customer service. Live The Vibe!</p>
          </div>
        </div>

        {/* Social Media */}
        <div className={styles.extra}>
          <div className={styles.socialSection}>
            <h4>Follow Us</h4>
            <div className={styles.socialIcons}>
              {/* TikTok */}
              <a 
                href="https://www.tiktok.com/@sergeantclippers" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialIcon} 
                aria-label="TikTok"
                style={{ background: '#000000' }}
              >
                <svg className={styles.socialSvg} viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a 
                href="https://youtube.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialIcon} 
                aria-label="YouTube"
                style={{ background: '#FF0000' }}
              >
                <svg className={styles.socialSvg} viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M23.498 6.186a2.997 2.997 0 0 0-2.11-2.12C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.388.566a2.997 2.997 0 0 0-2.11 2.12C0 8.07 0 12 0 12s0 3.93.502 5.814a2.997 2.997 0 0 0 2.11 2.12C4.495 20.5 12 20.5 12 20.5s7.505 0 9.388-.566a2.997 2.997 0 0 0 2.11-2.12C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/only_bangers99/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialIcon} 
                aria-label="Instagram"
                style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
              >
                <svg className={styles.socialSvg} viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a 
                href="https://www.facebook.com/profile.php?id=61582809069248" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialIcon} 
                aria-label="Facebook"
                style={{ background: '#1877F2' }}
              >
                <svg className={styles.socialSvg} viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/27699864730" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialIcon} 
                aria-label="WhatsApp"
                style={{ background: '#25D366' }}
              >
                <svg className={styles.socialSvg} viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.181-1.234-6.162-3.477-8.411z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={styles.bottom}>
          <p>
            {themeSettings?.footerText || `© ${currentYear} Only Bangers. All rights reserved. | Live The Vibe`}
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/privacy" className={styles.bottomLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={styles.bottomLink}>
              Terms of Service
            </Link>
            <Link href="/about" className={styles.bottomLink}>
              About Us 
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}