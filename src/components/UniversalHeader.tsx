'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getDefaultDashboardForRole, normalizeRole, type UserRole } from '@/lib/auth/roles'
import { supabase } from '@/lib/supabase/client'
import styles from './UniversalHeader.module.css'

type SearchResult = {
  title: string
  description: string
  url: string
  category: string
  keywords: string[]
}

const searchableContent: SearchResult[] = [
  { title: 'Services', description: 'View our barber services', url: '/services', category: 'Services', keywords: ['service', 'haircut', 'fade', 'beard', 'shave', 'trim', 'grooming'] },
  { title: 'Products', description: 'Premium grooming products', url: '/products', category: 'Products', keywords: ['product', 'pomade', 'oil', 'cream', 'treatment', 'shampoo', 'conditioner'] },
  { title: 'Blogs', description: 'Barbering tips and techniques', url: '/blogs', category: 'Blog', keywords: ['blog', 'article', 'tips', 'guide', 'tutorial', 'technique'] },
  { title: 'Book Appointment', description: 'Schedule with Only Bangers', url: '/services', category: 'Booking', keywords: ['booking', 'appointment', 'book', 'schedule'] },
  { title: 'About Us', description: 'Learn our story', url: '/about', category: 'About', keywords: ['about', 'story', 'mission', 'team'] },
  { title: 'Contact', description: 'Get in touch', url: '/contact', category: 'Contact', keywords: ['contact', 'email', 'message', 'reach'] },
  { title: 'Shopping Cart', description: 'View your cart', url: '/cart', category: 'Cart', keywords: ['cart', 'checkout', 'order', 'buy'] },
]

function getRoleLabel(role: UserRole) {
  if (role === 'admin') {
    return 'Admin Dashboard'
  }

  if (role === 'barber') {
    return 'Barber Dashboard'
  }

  if (role === 'customer') {
    return 'Customer Dashboard'
  }

  return 'Account'
}

export default function UniversalHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const headerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastScrollYRef = useRef(0)
  const pathname = usePathname()

  useEffect(() => {
    setIsAdminPage(pathname?.includes('/admin') || false)
    updateCartCount()

    const handleScroll = () => {
      if (!headerRef.current) return

      const headerHeight = headerRef.current.offsetHeight
      const currentScrollY = window.scrollY
      const scrolled = currentScrollY > headerHeight - 70
      const hasMeaningfulMovement =
        Math.abs(currentScrollY - lastScrollYRef.current) > 8

      setIsScrolled(scrolled)

      if (!scrolled) {
        setIsSearchBarVisible(true)
      } else if (hasMeaningfulMovement) {
        setIsSearchBarVisible(currentScrollY < lastScrollYRef.current)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('cartUpdated', updateCartCount)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [pathname])

  useEffect(() => {
    let isMounted = true

    const syncAuthState = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!isMounted) {
        return
      }

      if (userError || !user) {
        setIsLoggedIn(false)
        setUserRole(null)
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (error) {
        console.error('[UniversalHeader] Failed to resolve role:', error)
        setIsLoggedIn(true)
        setUserRole(null)
        return
      }

      setIsLoggedIn(true)
      setUserRole(normalizeRole(data?.role))
    }

    syncAuthState()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      syncAuthState()
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const updateCartCount = () => {
    if (typeof window === 'undefined') return

    if (!isAdminPage) {
      const savedCart = localStorage.getItem('onlyBangersCart')
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart)
          const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0)
          setCartItemsCount(count)
        } catch {
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

    const lowerQuery = query.toLowerCase()
    const results = searchableContent.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery)
      const descriptionMatch = item.description.toLowerCase().includes(lowerQuery)
      const keywordMatch = item.keywords.some((kw) => kw.includes(lowerQuery))
      return titleMatch || descriptionMatch || keywordMatch
    })

    setSearchResults(results)
    setShowSearchDropdown(results.length > 0)
  }

  const navigateToResult = (result: SearchResult) => {
    setSearchQuery('')
    setShowSearchDropdown(false)
    setSearchResults([])

    if (result.url.startsWith('http')) {
      window.open(result.url, '_blank')
    } else {
      window.location.href = result.url
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
      navigateToResult(searchResults[selectedResultIndex])
      return
    }

    if (searchResults.length > 0) {
      navigateToResult(searchResults[0])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedResultIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : -1))
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

  const dashboardHref = getDefaultDashboardForRole(userRole)

  return (
    <>
      <div className={styles.headerMainContainer} ref={headerRef}>
        <div className={styles.headerImageSection}>
          <img
            src="/images/header-bg.png"
            alt="Only Bangers Background"
            className={styles.headerBackgroundImage}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = document.createElement('div')
              fallback.className = styles.imageFallback
              target.parentNode?.insertBefore(fallback, target.nextSibling)
            }}
          />
          <div className={styles.imageOverlay}></div>

          <div className={styles.headerLogo}>
            <h1 className={styles.logoMain}>ONLY BANGERS</h1>
            <p className={styles.logoSub}>LIVE THE VIBE</p>
          </div>
        </div>

        <div
          className={`${styles.searchBarContainer} ${
            isScrolled ? styles.searchBarContainerFixed : ''
          } ${isScrolled && !isSearchBarVisible ? styles.searchBarContainerHidden : ''}`}
        >
          <div className={styles.searchBarWrapper}>
            <button
              onClick={() => setIsMenuOpen(true)}
              className={styles.navMenuButton}
              aria-label="Open menu"
            >
              <svg className={styles.navMenuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

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

            {!isAdminPage && isLoggedIn && userRole && (
              <Link href={dashboardHref} className={styles.navProfileButton} aria-label={getRoleLabel(userRole)}>
                <svg className={styles.navProfileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

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

      <div
        className={`${styles.menuOverlayBackdrop} ${isMenuOpen ? styles.menuOverlayBackdropActive : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

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
              <>
                {userRole ? (
                  <Link href={dashboardHref} className={styles.menuNavItem} onClick={() => setIsMenuOpen(false)}>
                    {getRoleLabel(userRole)}
                  </Link>
                ) : null}
                <form
                  method="post"
                  action="/auth/signout"
                  onSubmit={() => setIsMenuOpen(false)}
                  className={styles.menuNavForm}
                >
                  <button type="submit" className={styles.menuNavButton}>
                    Log Out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
