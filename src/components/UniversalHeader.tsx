'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

type NavLink = {
  label: string
  href: string
}

const BOOK_NOW_HREF = '/services'
// TODO: replace this with a real public barber page route once `/barber` exists.
const BARBER_PUBLIC_HREF = '/services'

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Barber', href: BARBER_PUBLIC_HREF },
  { label: 'Blogs', href: '/blogs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const baseSearchableContent: SearchResult[] = [
  {
    title: 'Services',
    description: 'View our barber services',
    url: '/services',
    category: 'Services',
    keywords: ['service', 'haircut', 'fade', 'beard', 'shave', 'trim', 'grooming'],
  },
  {
    title: 'Barber',
    description: 'Meet the Only Bangers barber experience',
    url: BARBER_PUBLIC_HREF,
    category: 'Barber',
    keywords: ['barber', 'team', 'artist', 'cut', 'fade', 'groomer'],
  },
  {
    title: 'Blogs',
    description: 'Barbering tips and techniques',
    url: '/blogs',
    category: 'Blog',
    keywords: ['blog', 'article', 'tips', 'guide', 'tutorial', 'technique'],
  },
  {
    title: 'Book Appointment',
    description: 'Start your booking and WhatsApp checkout',
    url: BOOK_NOW_HREF,
    category: 'Booking',
    keywords: ['booking', 'appointment', 'book', 'schedule', 'checkout'],
  },
  {
    title: 'About Us',
    description: 'Learn our story',
    url: '/about',
    category: 'About',
    keywords: ['about', 'story', 'mission', 'team'],
  },
  {
    title: 'Contact',
    description: 'Get in touch',
    url: '/contact',
    category: 'Contact',
    keywords: ['contact', 'email', 'message', 'reach'],
  },
  {
    title: 'Shopping Cart',
    description: 'View your cart',
    url: '/cart',
    category: 'Cart',
    keywords: ['cart', 'checkout', 'order', 'buy'],
  },
  {
    title: 'WhatsApp Payment',
    description: 'Send payment proof and complete your booking verification',
    url: BOOK_NOW_HREF,
    category: 'Payments',
    keywords: ['whatsapp', 'payment', 'proof', 'verify', 'booking'],
  },
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

function isActiveLink(pathname: string | null, href: string) {
  if (!pathname) {
    return false
  }

  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function UniversalHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const searchPanelRef = useRef<HTMLDivElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const showHero = useMemo(() => {
    if (!pathname) {
      return true
    }

    return !(
      pathname.startsWith('/admin') ||
      pathname.startsWith('/portal') ||
      pathname.startsWith('/barber/dashboard')
    )
  }, [pathname])

  useEffect(() => {
    setIsAdminPage(pathname?.includes('/admin') || false)
    updateCartCount()
  }, [pathname])

  useEffect(() => {
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [isAdminPage])

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

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    searchInputRef.current?.focus()
  }, [isSearchOpen])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (isSearchOpen && searchPanelRef.current && !searchPanelRef.current.contains(target)) {
        setIsSearchOpen(false)
      }

      if (isMenuOpen && menuPanelRef.current && !menuPanelRef.current.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      setIsSearchOpen(false)
      setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen, isSearchOpen])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [pathname])

  const dashboardHref = getDefaultDashboardForRole(userRole)
  const profileHref = isLoggedIn && userRole ? dashboardHref : '/login'

  const searchableContent = useMemo(() => {
    const dynamicItems: SearchResult[] = [
      {
        title: 'My Dashboard',
        description: isLoggedIn && userRole ? `Open your ${getRoleLabel(userRole)}` : 'Sign in to access your dashboard',
        url: isLoggedIn && userRole ? dashboardHref : '/login',
        category: 'Account',
        keywords: ['dashboard', 'account', 'portal', 'admin', 'barber', 'customer', 'profile'],
      },
    ]

    return [...baseSearchableContent, ...dynamicItems]
  }, [dashboardHref, isLoggedIn, userRole])

  function updateCartCount() {
    if (typeof window === 'undefined') {
      return
    }

    if (!isAdminPage) {
      const savedCart = window.localStorage.getItem('onlyBangersCart')

      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart)
          const count = cart.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 0), 0)
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

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSelectedResultIndex(-1)
  }

  const openSearch = () => {
    setIsSearchOpen(true)
    setSelectedResultIndex(-1)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value
    setSearchQuery(query)
    setSelectedResultIndex(-1)

    if (query.trim().length === 0) {
      setSearchResults([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const results = searchableContent.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery)
      const descriptionMatch = item.description.toLowerCase().includes(lowerQuery)
      const keywordMatch = item.keywords.some((keyword) => keyword.includes(lowerQuery))
      return titleMatch || descriptionMatch || keywordMatch
    })

    setSearchResults(results)
  }

  const navigateToResult = (result: SearchResult) => {
    closeSearch()

    if (result.url.startsWith('http')) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
      return
    }

    router.push(result.url)
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
      navigateToResult(searchResults[selectedResultIndex])
      return
    }

    if (searchResults[0]) {
      navigateToResult(searchResults[0])
    }
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedResultIndex((current) =>
          current < searchResults.length - 1 ? current + 1 : current
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedResultIndex((current) => (current > 0 ? current - 1 : -1))
        break
      case 'Enter':
        if (searchResults.length > 0) {
          event.preventDefault()
          if (selectedResultIndex >= 0) {
            navigateToResult(searchResults[selectedResultIndex])
          } else {
            navigateToResult(searchResults[0])
          }
        }
        break
      case 'Escape':
        event.preventDefault()
        closeSearch()
        break
      default:
        break
    }
  }

  return (
    <>
      <header className={styles.headerShell}>
        <div className={styles.navSpacer} />

        <div className={styles.topNavWrap}>
          <div className={styles.topNav}>
            <div className={styles.mobileCluster}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className={styles.iconButton}
                aria-label="Open navigation menu"
                aria-expanded={isMenuOpen}
              >
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link href="/" className={styles.mobileBrand} aria-label="Only Bangers home">
                ONLY BANGERS
              </Link>
            </div>

            <div className={styles.desktopBrandRow}>
              <Link href="/" className={styles.brand} aria-label="Only Bangers home">
                ONLY BANGERS
              </Link>

              <nav className={styles.desktopNav} aria-label="Primary navigation">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={styles.navLink}
                    data-active={isActiveLink(pathname, link.href)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className={styles.actions}>
              <div className={styles.searchShell} ref={searchPanelRef}>
                <button
                  type="button"
                  onClick={() => (isSearchOpen ? closeSearch() : openSearch())}
                  className={styles.iconButton}
                  aria-label="Open search"
                  aria-expanded={isSearchOpen}
                >
                  <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {isSearchOpen ? (
                  <div className={styles.searchPanel}>
                    <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                      <label htmlFor="header-search" className={styles.searchLabel}>
                        Search Only Bangers
                      </label>
                      <div className={styles.searchInputWrap}>
                        <svg className={styles.searchInputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          id="header-search"
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Search services, booking, dashboard, barber..."
                          className={styles.searchInput}
                        />
                      </div>
                    </form>

                    <div className={styles.searchResults}>
                      {searchQuery.trim().length === 0 ? (
                        <p className={styles.searchEmpty}>Search for services, booking help, barber info, or your dashboard.</p>
                      ) : searchResults.length === 0 ? (
                        <p className={styles.searchEmpty}>No matching results found.</p>
                      ) : (
                        searchResults.map((result, index) => (
                          <button
                            key={`${result.title}-${result.url}-${index}`}
                            type="button"
                            className={styles.searchResult}
                            data-active={selectedResultIndex === index}
                            onMouseEnter={() => setSelectedResultIndex(index)}
                            onClick={() => navigateToResult(result)}
                          >
                            <div className={styles.searchCopy}>
                              <span className={styles.searchTitle}>{result.title}</span>
                              <span className={styles.searchDescription}>{result.description}</span>
                            </div>
                            <span className={styles.searchCategory}>{result.category}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {!isAdminPage ? (
                <Link
                  href={profileHref}
                  className={`${styles.iconButton} ${styles.desktopOnly}`}
                  aria-label={isLoggedIn && userRole ? getRoleLabel(userRole) : 'Login or sign up'}
                >
                  <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              ) : null}

              {!isAdminPage ? (
                <Link href="/cart" className={styles.iconButton} aria-label="Shopping cart">
                  <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItemsCount > 0 ? <span className={styles.cartBadge}>{cartItemsCount}</span> : null}
                </Link>
              ) : null}

              <Link href={BOOK_NOW_HREF} className={styles.bookNowButton}>
                Book Now
              </Link>
            </div>
          </div>
        </div>

        {showHero ? (
          <section className={styles.heroSection}>
            <img
              src="/images/header-bg.png"
              alt="Only Bangers premium barbering hero background"
              className={styles.heroImage}
            />
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <p className={styles.kicker}>Only Bangers</p>
              <h1 className={styles.heroTitle}>ONLY BANGERS</h1>
              <p className={styles.heroSubtitle}>LIVE THE VIBE</p>
              <Link href={BOOK_NOW_HREF} className={styles.heroButton}>
                Book Your Cut
              </Link>
            </div>
          </section>
        ) : null}
      </header>

      <div
        className={`${styles.menuOverlay} ${isMenuOpen ? styles.menuOverlayVisible : ''}`}
        aria-hidden={!isMenuOpen}
      />

      <aside
        ref={menuPanelRef}
        className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}
        aria-label="Sidebar navigation"
      >
        <div className={styles.sidebarHeader}>
          <div>
            <p className={styles.sidebarEyebrow}>Menu</p>
            <h2 className={styles.sidebarTitle}>Only Bangers</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className={styles.iconButton}
            aria-label="Close navigation menu"
            aria-expanded={isMenuOpen}
          >
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <nav className={styles.sidebarNav} aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={styles.sidebarLink}
                data-active={isActiveLink(pathname, link.href)}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link href={BOOK_NOW_HREF} className={styles.sidebarBookNow} onClick={() => setIsMenuOpen(false)}>
              Book Now
            </Link>
          </nav>

          <div className={styles.sidebarSection}>
            <p className={styles.sidebarEyebrow}>Account</p>

            {!isLoggedIn ? (
              <div className={styles.sidebarActions}>
                <Link href="/login" className={styles.sidebarActionLink} onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/login" className={styles.sidebarActionLink} onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className={styles.sidebarActions}>
                {userRole ? (
                  <Link href={dashboardHref} className={styles.sidebarActionLink} onClick={() => setIsMenuOpen(false)}>
                    {getRoleLabel(userRole)}
                  </Link>
                ) : null}
                <form
                  method="post"
                  action="/auth/signout"
                  onSubmit={() => setIsMenuOpen(false)}
                  className={styles.sidebarLogoutForm}
                >
                  <button type="submit" className={styles.sidebarLogoutButton}>
                    Logout
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
