'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './admin.module.css';

type UserRole = 'owner' | 'admin' | 'barber' | 'client' | null;

interface UserData {
  email?: string;
  role: UserRole;
}

export default function AdminPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch('/api/admin/whoami');
        if (!res.ok) {
          setUserData(null);
          return;
        }
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loadingMessage}>Loading...</p>
      </div>
    );
  }

  // User logged in but no admin role yet
  if (!userData || (userData.role !== 'owner' && userData.role !== 'admin')) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Admin Access</h1>
            <p className={styles.subtitle}>Phase 4 - Role-Based Access</p>
          </div>
          <Link href="/login" className={styles.logoutButton}>
            Logout
          </Link>
        </header>

        <main className={styles.main}>
          <section className={styles.messageCard}>
            <div className={styles.messageIcon}>🔐</div>
            <h2 className={styles.messageTitle}>Access Denied</h2>
            <p className={styles.messageText}>
              You are logged in, but your account is not an admin yet.
            </p>
            <p className={styles.messageSubtext}>
              Current role: <strong>{userData?.role || 'none'}</strong>
            </p>
            <p className={styles.messageHint}>
              Contact the owner to request admin access.
            </p>
          </section>
        </main>
      </div>
    );
  }

  // Admin/Owner access granted
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Phase 4 - Only Bangers Management</p>
          <p className={styles.roleLabel}>
            Role: <strong>{userData.role?.toUpperCase()}</strong> • {userData.email}
          </p>
        </div>
        <Link href="/login" className={styles.logoutButton}>
          Logout
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Barber Approvals Card */}
          <section className={styles.card}>
            <div className={styles.cardIcon}>📋</div>
            <h2 className={styles.cardTitle}>Barber Approvals</h2>
            <p className={styles.cardDescription}>
              Review and approve new barber profiles. Manage barber credentials and performance metrics.
            </p>
            <div className={styles.cardStats}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Pending</span>
                <span className={styles.statValue}>0</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Approved</span>
                <span className={styles.statValue}>3</span>
              </span>
            </div>
            <button className={styles.cardButton} disabled>
              Coming Soon
            </button>
          </section>

          {/* Product Approvals Card */}
          <section className={styles.card}>
            <div className={styles.cardIcon}>📦</div>
            <h2 className={styles.cardTitle}>Product Approvals</h2>
            <p className={styles.cardDescription}>
              Manage product inventory and listings. Review new products and update pricing.
            </p>
            <div className={styles.cardStats}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Pending</span>
                <span className={styles.statValue}>0</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Active</span>
                <span className={styles.statValue}>12</span>
              </span>
            </div>
            <button className={styles.cardButton} disabled>
              Coming Soon
            </button>
          </section>

          {/* Analytics Card */}
          <section className={styles.card}>
            <div className={styles.cardIcon}>📊</div>
            <h2 className={styles.cardTitle}>Analytics</h2>
            <p className={styles.cardDescription}>
              View platform analytics, user growth, and booking metrics. Track revenue and performance.
            </p>
            <div className={styles.cardStats}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Users</span>
                <span className={styles.statValue}>0</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Revenue</span>
                <span className={styles.statValue}>R0</span>
              </span>
            </div>
            <button className={styles.cardButton} disabled>
              Coming Soon
            </button>
          </section>
        </div>

        <section className={styles.banner}>
          <h3 className={styles.bannerTitle}>Phase 4 - Temporary Admin Gate</h3>
          <p className={styles.bannerText}>
            This admin system uses a simple secret-based authentication for Phase 4 development.
            In Phase 5, this will be upgraded to proper role-based access control (RBAC) with
            database-backed owner/admin roles.
          </p>
        </section>
      </main>
    </div>
  );
}
