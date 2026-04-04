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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const headerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const pathname = usePathname()

  // Sample searchable content
  const searchableContent = [
    { title: 'Services', description: 'View our barber services', url: '/services', category: 'Services', keywords: ['service', 'haircut', 'fade', 'beard', 'shave', 'trim', 'grooming'] },
    { title: 'Products', description: 'Premium grooming products', url: '/products', category: 'Products', keywords: ['product', 'pomade', 'oil', 'cream', 'treatment', 'shampoo', 'conditioner'] },
    { title: 'Blogs', description: 'Barbering tips and techniques', url: '/blogs', category: 'Blog', keywords: ['blog', 'article', 'tips', 'guide', 'tutorial', 'technique'] },
    { title: 'Book Appointment', description: 'Schedule with Antonio', url: 'https://calendly.com/onlybangers', category: 'Booking', keywords: ['booking', 'appointment', 'book', 'schedule', 'calendly'] },
    { title: 'About Us', description: 'Learn our story', url: '/about', category: 'About', keywords: ['about', 'story', 'mission', 'team'] },
    { title: 'Contact', description: 'Get in touch', url: '/contact', category: 'Contact', keywords: ['contact', 'email', 'message', 'reach'] },
    { title: 'Shopping Cart', description: 'View your cart', url: '/cart', category: 'Cart', keywords: ['cart', 'checkout', 'order', 'buy'] },
  ]

  // Client-side only effects
  useEffect(() => {
    // Check admin page
    const adminCheck = pathname?.includes('/admin') || false
    setIsAdminPage(adminCheck)
    
    // Check login status
    const user = localStorage.getItem('onlyBangersUser')
    setIsLoggedIn(!!user)
    
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
    window.addEventListener('userLoggedIn', () => setIsLoggedIn(true))
    window.addEventListener('userLoggedOut', () => setIsLoggedIn(false))

    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('cartUpdated', updateCartCount)
      window.removeEventListener('userLoggedIn', () => setIsLoggedIn(true))
      window.removeEventListener('userLoggedOut', () => setIsLoggedIn(false))
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
    const query = e.target.value
    setSearchQuery(query)
    setSelectedResultIndex(-1)
    
    if (query.trim().length === 0) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    // Filter searchable content based on query
    const lowerQuery = query.toLowerCase()
    const results = searchableContent.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery)
      const descriptionMatch = item.description.toLowerCase().includes(lowerQuery)
      const keywordMatch = item.keywords.some(kw => kw.includes(lowerQuery))
      return titleMatch || descriptionMatch || keywordMatch
    })

    setSearchResults(results)
    setShowSearchDropdown(results.length > 0)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If a result is selected, navigate to it
    if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
      navigateToResult(searchResults[selectedResultIndex])
      return
    }
    
    // Otherwise search for first matching result
    if (searchResults.length > 0) {
      navigateToResult(searchResults[0])
    }
  }

  const navigateToResult = (result: any) => {
    setSearchQuery('')
    setShowSearchDropdown(false)
    setSearchResults([])
    
    if (result.url.startsWith('http')) {
      window.open(result.url, '_blank')
    } else {
      window.location.href = result.url
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedResultIndex >= 0) {
          navigateToResult(searchResults[selectedResultIndex])
        } else if (searchResults.length > 0) {
          navigateToResult(searchResults[0])
        }
        break
      case 'Escape':
        setShowSearchDropdown(false)
        break
      default:
        break
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
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search services or products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  className={styles.searchBarInput}
                />
                
                {/* Search Results Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className={styles.searchDropdown}>
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.url}-${index}`}
                        className={`${styles.searchResultItem} ${selectedResultIndex === index ? styles.searchResultItemActive : ''}`}
                        onClick={() => navigateToResult(result)}
                        onMouseEnter={() => setSelectedResultIndex(index)}
                      >
                        <div className={styles.searchResultContent}>
                          <div className={styles.searchResultTitle}>{result.title}</div>
                          <div className={styles.searchResultDescription}>{result.description}</div>
                        </div>
                        <div className={styles.searchResultCategory}>{result.category}</div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Profile Button - Show only when logged in */}
            {!isAdminPage && isLoggedIn && (
              <Link href="/portal/dashboard" className={styles.navProfileButton} aria-label="User profile">
                <svg className={styles.navProfileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

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
            
            <Link href="/services" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
              Services
            </Link>
            
            <Link href="/products" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
              Products
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
            <h3 className={styles.menuSectionHeading}>ACCOUNT</h3>
            {!isLoggedIn ? (
              <>
                <Link href="/login" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/login" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href="/portal/dashboard" className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
                Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}