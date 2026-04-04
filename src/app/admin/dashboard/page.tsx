'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './dashboard.module.css'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [bookings, setBookings] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('onlyBangersAdmin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    try {
      const parsedAdmin = JSON.parse(adminData)
      setAdmin(parsedAdmin)
    } catch {
      router.push('/admin/login')
      return
    }

    // Load data
    loadDashboardData()
    setIsLoading(false)
  }, [router])

  const loadDashboardData = () => {
    // Load bookings
    const bookingsData = JSON.parse(localStorage.getItem('onlyBangersBookings') || '[]')
    setBookings(bookingsData)

    // Load cart items (abandoned carts)
    const cartData = JSON.parse(localStorage.getItem('onlyBangersCart') || '[]')
    setCartItems(cartData)

    // Load users
    const usersData = JSON.parse(localStorage.getItem('onlyBangersUsers') || '[]')
    setUsers(usersData)
  }

  const handleLogout = () => {
    localStorage.removeItem('onlyBangersAdmin')
    router.push('/admin/login')
  }

  if (isLoading || !admin) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  const stats = {
    totalBookings: bookings.length,
    totalUsers: users.length,
    totalCartItems: cartItems.length,
    revenue: cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  }

  return (
    <div className={styles.adminContainer}>
      {/* Admin Header */}
      <header className={styles.adminHeader}>
        <div className={styles.headerContent}>
          <h1>Admin Dashboard</h1>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>{admin.name}</span>
            <button 
              onClick={handleLogout} 
              className={styles.logoutBtn}
              aria-label="Logout from admin panel"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
              aria-label="View overview"
              aria-pressed={activeTab === 'overview'}
            >
              <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m2 3l2-3m2 3l2-3m2-4a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Overview
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`${styles.navItem} ${activeTab === 'bookings' ? styles.navItemActive : ''}`}
              aria-label="View bookings"
              aria-pressed={activeTab === 'bookings'}
            >
              <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bookings
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}
              aria-label="View users"
              aria-pressed={activeTab === 'users'}
            >
              <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 14a7 7 0 100-14 7 7 0 000 14zm0 0a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              Users
            </button>

            <button
              onClick={() => setActiveTab('carts')}
              className={`${styles.navItem} ${activeTab === 'carts' ? styles.navItemActive : ''}`}
              aria-label="View abandoned carts"
              aria-pressed={activeTab === 'carts'}
            >
              <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart Items
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <section className={styles.contentSection}>
              <h2>Dashboard Overview</h2>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#D4AF37' }}>
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Total Bookings</h3>
                    <p className={styles.statValue}>{stats.totalBookings}</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#4F46E5' }}>
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 14a7 7 0 100-14 7 7 0 000 14z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Total Users</h3>
                    <p className={styles.statValue}>{stats.totalUsers}</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#EC4899' }}>
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 3h19.5A2.25 2.25 0 0124 5.25v13.5A2.25 2.25 0 0121.75 21H2.25A2.25 2.25 0 010 18.75V5.25A2.25 2.25 0 012.25 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Abandoned Carts</h3>
                    <p className={styles.statValue}>{stats.totalCartItems}</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#10B981' }}>
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Est. Revenue</h3>
                    <p className={styles.statValue}>R{stats.revenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className={styles.welcomeSection}>
                <h3>Welcome to Admin Panel</h3>
                <p>Manage your Only Bangers business efficiently. View bookings, track users, and monitor cart activity.</p>
              </div>
            </section>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <section className={styles.contentSection}>
              <h2>Bookings Management</h2>
              
              {bookings.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No bookings recorded yet.</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking: any, idx: number) => (
                        <tr key={idx}>
                          <td>{booking.name}</td>
                          <td>{booking.email}</td>
                          <td>{booking.service}</td>
                          <td>{booking.date}</td>
                          <td>{booking.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <section className={styles.contentSection}>
              <h2>Users Management</h2>
              
              {users.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No users registered yet.</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: any, idx: number) => (
                        <tr key={idx}>
                          <td>{user.name || 'N/A'}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Carts Tab */}
          {activeTab === 'carts' && (
            <section className={styles.contentSection}>
              <h2>Abandoned Carts</h2>
              
              {cartItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No abandoned carts.</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.type}</td>
                          <td>R{item.price}</td>
                          <td>{item.quantity}</td>
                          <td>R{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
