// components/UniversalHeader/index.tsx - UPDATED WITH CSS MODULES
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { services } from '@/data/services'
import { barbers } from '@/data/barbers'
import styles from './UniversalHeader.module.css'

export default function UniversalHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const pathname = usePathname()
  const router = useRouter()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Initialize on client
  useEffect(() => {
    setIsClient(true)
    const adminCheck = pathname?.includes('/admin') || false
    setIsAdminPage(adminCheck)
    updateCartCount()

    const handleCartUpdate = () => updateCartCount()
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [pathname])

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showResults])

  const updateCartCount = () => {
    if (typeof window !== 'undefined' && !isAdminPage) {
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

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.trim()) {
      const query = value.toLowerCase()
      const allSearchableContent = [
        // All services
        ...services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          type: 'service',
          price: service.price,
          duration: service.duration,
          category: service.category,
          keywords: [service.name, service.description, service.category].join(' ').toLowerCase()
        })),
        // All barbers
        ...barbers.map(barber => ({
          id: barber.id,
          name: barber.name,
          description: barber.specialty,
          type: 'barber',
          specialty: barber.specialty,
          keywords: [barber.name, barber.specialty].join(' ').toLowerCase()
        })),
        // All pages
        {
          id: 'home',
          name: 'Home',
          description: 'Back to home page',
          type: 'page',
          url: '/',
          keywords: 'home page main'
        },
        {
          id: 'about',
          name: 'About Us',
          description: 'Learn about Only Bangers',
          type: 'page',
          url: '/about',
          keywords: 'about story brand'
        },
        {
          id: 'services',
          name: 'Services',
          description: 'View all our services',
          type: 'page',
          url: '/services',
          keywords: 'services haircut fade beard'
        },
        {
          id: 'products',
          name: 'Products',
          description: 'Shop grooming products',
          type: 'page',
          url: '/products',
          keywords: 'products shop pomade oils'
        },
        {
          id: 'cart',
          name: 'Shopping Cart',
          description: 'View your shopping cart',
          type: 'page',
          url: '/cart',
          keywords: 'cart checkout shopping'
        },
        {
          id: 'contact',
          name: 'Contact Us',
          description: 'Get in touch with us',
          type: 'page',
          url: '/contact',
          keywords: 'contact email message support'
        },
        {
          id: 'blogs',
          name: 'Blog',
          description: 'Read our latest blog posts',
          type: 'page',
          url: '/blogs',
          keywords: 'blog articles news posts'
        },
        {
          id: 'privacy',
          name: 'Privacy Policy',
          description: 'Our privacy policy',
          type: 'page',
          url: '/privacy',
          keywords: 'privacy policy legal'
        },
        {
          id: 'terms',
          name: 'Terms of Service',
          description: 'Our terms and conditions',
          type: 'page',
          url: '/terms',
          keywords: 'terms conditions service legal'
        },
        {
          id: 'booking',
          name: 'Book Appointment',
          description: 'Schedule with Antonio Prince',
          type: 'action',
          url: 'https://calendly.com/onlybangers',
          external: true,
          keywords: 'book appointment booking calendar schedule'
        }
      ]
      
      // Filter results that match the search query
      const filtered = allSearchableContent.filter(item => {
        const searchableText = `${item.name} ${item.description} ${item.keywords || ''}`.toLowerCase()
        return searchableText.includes(query)
      })
      
      setSearchResults(filtered)
      setShowResults(filtered.length > 0)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() && searchResults.length > 0) {
      handleNavigateToResult(searchResults[0])
    }
  }

  const handleNavigateToResult = (result: any) => {
    setShowResults(false)
    setSearchQuery('')
    setSearchResults([])
    
    if (result.type === 'page' || result.type === 'action') {
      if (result.external) {
        window.open(result.url, '_blank')
      } else {
        router.push(result.url)
      }
    } else if (result.type === 'service') {
      router.push('/services')
    } else if (result.type === 'barber') {
      router.push('/services')
    }
  }

  // Handle keyboard navigation in search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  // SSR-safe initial render
  if (!isClient) {
    return (
      <header className={styles.header}>
        <div className={styles.headerBg}></div>
        <div className={styles.logoSection}>
          <h1 className={styles.logoTitle}>ONLY BANGERS</h1>
          <p className={styles.logoSubtitle}>LIVE THE VIBE</p>
        </div>
        <nav className={styles.navBar}>
          <div className={styles.navContainer}>
            <button className={styles.menuButton} aria-label="Open menu">
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className={styles.searchContainer}>
              <form className={styles.searchBox}>
                <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search..."
                  className={styles.searchInput}
                  disabled
                  value=""
                  readOnly
                />
              </form>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.cartButton} aria-label="Shopping cart">
                <svg className={styles.cartIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerBg}></div>
        
        <div className={styles.logoSection}>
          <h1 className={styles.logoTitle}>ONLY BANGERS</h1>
          <p className={styles.logoSubtitle}>LIVE THE VIBE</p>
        </div>

        <nav className={styles.navBar}>
          <div className={styles.navContainer}>
            <button onClick={() => setIsMenuOpen(true)} className={styles.menuButton} aria-label="Open menu">
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className={styles.searchContainer} ref={searchContainerRef}>
              <form onSubmit={handleSearch} className={styles.searchBox}>
                <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search services or products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className={styles.searchInput}
                  autoComplete="off"
                />
              </form>
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      className={styles.searchResultItem}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleNavigateToResult(result)
                      }}
                      type="button"
                    >
                      <div className={styles.resultContent}>
                        <div className={styles.resultName}>{result.name}</div>
                        <div className={styles.resultDescription}>{result.description}</div>
                      </div>
                      <span className={styles.resultBadge}>{result.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Button */}
            {!isAdminPage && (
              <Link href="/cart" className={styles.cartButton} aria-label="Shopping cart">
                <svg className={styles.cartIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && <span className={styles.cartBadge}>{cartItemsCount}</span>}
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Menu Overlay */}
      <div 
        className={`${styles.sidebarOverlayBackdrop} ${isMenuOpen ? styles.active : ''}`} 
        onClick={() => setIsMenuOpen(false)} 
      />
      
      {/* Sidebar Menu */}
      <div className={`${styles.sidebarContainer} ${isMenuOpen ? styles.show : ''}`}>
        <div className={styles.sidebarHeader}>
          <button onClick={() => setIsMenuOpen(false)} className={styles.backButton} aria-label="Close menu">
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className={styles.sidebarTitle}>Menu</h2>
        </div>

        <div className={styles.sidebarContent}>
          {/* Navigation Section */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarSectionTitle}>NAVIGATION</h3>
            
            <Link href="/" className={styles.sidebarMenuItem} onClick={() => setIsMenuOpen(false)}>
              <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            
            <Link href="/services" className={styles.sidebarMenuItem} onClick={() => setIsMenuOpen(false)}>
              <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Services
            </Link>
            
            <Link href="/products" className={styles.sidebarMenuItem} onClick={() => setIsMenuOpen(false)}>
              <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Products
            </Link>
            
            <Link href="/book" className={styles.sidebarMenuItem} onClick={() => setIsMenuOpen(false)}>
              <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Appointment
            </Link>
            
            {!isAdminPage && (
              <Link href="/cart" className={styles.sidebarMenuItem} onClick={() => setIsMenuOpen(false)}>
                <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cart
                {cartItemsCount > 0 && (
                  <span className={styles.cartBadgeSidebar}>{cartItemsCount}</span>
                )}
              </Link>
            )}
          </div>

          {/* Contact Section */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarSectionTitle}>CONTACT</h3>
            <a href="tel:+27699864730" className={styles.sidebarMenuItem}>
              <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
            <a href="https://wa.me/27699864730" className={styles.sidebarMenuItem}>
              <svg className={styles.sidebarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  )
}