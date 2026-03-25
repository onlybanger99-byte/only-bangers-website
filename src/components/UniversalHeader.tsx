// src/components/UniversalHeader.tsx - WITH IMAGE BACKGROUND
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './UniversalHeader.module.css'

export default function UniversalHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  
  const pathname = usePathname()

  // Client-side only effects
  useEffect(() => {
    // Check admin page
    const adminCheck = pathname?.includes('/admin') || false
    setIsAdminPage(adminCheck)
    
    // Update cart count
    updateCartCount()

    // Handle scroll
    const handleScroll = () => {
      if (!headerRef.current) return
      const headerHeight = headerRef.current.offsetHeight
      const scrolled = window.scrollY > headerHeight - 70
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('cartUpdated', updateCartCount)

    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [pathname])

  const updateCartCount = () => {
    if (typeof window === 'undefined') return
    
    if (!isAdminPage) {
      const savedCart = localStorage.getItem('onlyBangersCart')
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart)
          const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0)
          setCartItemsCount(count)
        } catch (error) {
          setCartItemsCount(0)
        }
      } else {
        setCartItemsCount(0)
      }
    } else {
      setCartItemsCount(0)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <>
      {/* Main Header Container */}
      <div className={styles.headerMainContainer} ref={headerRef}>
        
        {/* Image Section (replaces video) */}
        <div className={styles.headerImageSection}>
          {/* Background Image */}
          <img
            src="/images/header-bg.png"  // Update with your image path
            alt="Only Bangers Background"
            className={styles.headerBackgroundImage}
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = document.createElement('div')
              fallback.className = styles.imageFallback
              target.parentNode?.insertBefore(fallback, target.nextSibling)
            }}
          />
          <div className={styles.imageOverlay}></div>
          
          {/* Logo */}
          <div className={styles.headerLogo}>
            <h1 className={styles.logoMain}>ONLY BANGERS</h1>
            <p className={styles.logoSub}>LIVE THE VIBE</p>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className={`${styles.searchBarContainer} ${isScrolled ? styles.searchBarContainerFixed : ''}`}>
          <div className={styles.searchBarWrapper}>
            
            {/* Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className={styles.navMenuButton} 
              aria-label="Open menu"
            >
              <svg className={styles.navMenuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search Bar */}
            <div className={styles.searchBar}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <svg className={styles.searchBarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search services or products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={styles.searchBarInput}
                />
              </form>
            </div>

            {/* Cart Button */}
            {!isAdminPage && (
              <Link href="/cart" className={styles.navCartButton} aria-label="Shopping cart">
                <svg className={styles.navCartIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && <span className={styles.navCartBadge}>{cartItemsCount}</span>}
              </Link>
            )}
            
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      <div 
        className={`${styles.menuOverlayBackdrop} ${isMenuOpen ? styles.menuOverlayBackdropActive : ''}`} 
        onClick={() => setIsMenuOpen(false)} 
      />
      
      {/* Sidebar Menu */}
      <div className={`${styles.sidebarNavMenu} ${isMenuOpen ? styles.sidebarNavMenuOpen : ''}`}>
        <div className={styles.menuNavHeader}>
          <button onClick={() => setIsMenuOpen(false)} className={styles.menuCloseButton} aria-label="Close menu">
            <svg className={styles.menuCloseIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className={styles.menuNavTitle}>Menu</h2>
        </div>

        <div className={styles.menuNavContent}>
          <div className={styles.menuNavSection}>
            <h3 className={styles.menuSectionHeading}>NAVIGATION</h3>
            
            <Link href="/" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            
            <Link href="/haircuts" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
              Haircuts
            </Link>
            
            <Link href="/promotion-deals" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
              Promotion Deals
            </Link>
            
            {!isAdminPage && (
              <Link href="/cart" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
                Cart
                {cartItemsCount > 0 && (
                  <span className={styles.menuCartBadge}>{cartItemsCount}</span>
                )}
              </Link>
            )}
          </div>

          <div className={styles.menuNavSection}>
            <h3 className={styles.menuSectionHeading}>CONTACT</h3>
            <a href="tel:+27699864730" className={styles.menuNavItem}>
              Call Us
            </a>
            <a href="https://wa.me/27699864730" className={styles.menuNavItem}>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  )
}