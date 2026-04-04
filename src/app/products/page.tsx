'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './products.module.css'

export default function ProductsPage() {
  const products = [
    { id: '1', name: 'Premium Hair Pomade', price: 150, category: 'Styling', description: 'Strong hold with natural shine' },
    { id: '2', name: 'Beard Oil Kit', price: 200, category: 'Beard Care', description: 'Nourishing blend for beard health' },
    { id: '3', name: 'Shaving Cream', price: 120, category: 'Shaving', description: 'Rich lather for smooth shave' },
    { id: '4', name: 'Hair Tonic', price: 180, category: 'Treatment', description: 'Revitalizes and strengthens hair' },
    { id: '5', name: 'Aftershave Balm', price: 160, category: 'Post-Shave', description: 'Soothes and moisturizes skin' },
    { id: '6', name: 'Scalp Treatment', price: 220, category: 'Treatment', description: 'Deep cleansing scalp treatment' },
    { id: '7', name: 'Grooming Kit', price: 350, category: 'Kit', description: 'Complete grooming essentials' },
    { id: '8', name: 'Travel Set', price: 280, category: 'Kit', description: 'Portable grooming products' },
  ]

  const [filter, setFilter] = useState('all')

  const addToCart = (product: any) => {
    const cartItem = {
      ...product,
      quantity: 1,
      type: 'product' as const
    }
    
    const existingCart = JSON.parse(localStorage.getItem('onlyBangersCart') || '[]')
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem('onlyBangersCart', JSON.stringify(existingCart))
    window.dispatchEvent(new Event('cartUpdated'))
    alert(`${product.name} added to cart!`)
  }

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(product => product.category === filter)

  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Premium Products</h1>
          <p className="page-subtitle">Professional grooming products for the modern man</p>
        </div>

        <div className="filter-section">
          <div className="filter-buttons">
            <button 
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              aria-label="Show all products"
              aria-pressed={filter === 'all'}
            >
              All Products
            </button>
            <button 
              onClick={() => setFilter('Styling')}
              className={`filter-btn ${filter === 'Styling' ? 'active' : ''}`}
              aria-label="Filter by styling products"
              aria-pressed={filter === 'Styling'}
            >
              Styling
            </button>
            <button 
              onClick={() => setFilter('Beard Care')}
              className={`filter-btn ${filter === 'Beard Care' ? 'active' : ''}`}
              aria-label="Filter by beard care products"
              aria-pressed={filter === 'Beard Care'}
            >
              Beard Care
            </button>
            <button 
              onClick={() => setFilter('Shaving')}
              className={`filter-btn ${filter === 'Shaving' ? 'active' : ''}`}
              aria-label="Filter by shaving products"
              aria-pressed={filter === 'Shaving'}
            >
              Shaving
            </button>
            <button 
              onClick={() => setFilter('Kit')}
              className={`filter-btn ${filter === 'Kit' ? 'active' : ''}`}
              aria-label="Filter by kit products"
              aria-pressed={filter === 'Kit'}
            >
              Kits
            </button>
          </div>
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="image-container-card">
                <div className="image-placeholder">
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>
              </div>
              
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 className="card-title">{product.name}</h3>
                  <span className={styles.categoryBadge}>{product.category}</span>
                </div>
                
                <p className="card-description">{product.description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span className="card-price">R{product.price}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    className="card-button"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaSection}>
          <h2>Need Help Choosing Products?</h2>
          <p>Visit our barber shop for personalized recommendations</p>
          <a 
            href="https://www.google.com/maps/@-26.3986898,27.8370213,3a,75y,90t/data=!3m7!1e1!3m5!1syZZmHoclcj5_FlBnfSr7PQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DyZZmHoclcj5_FlBnfSr7PQ%26yaw%3D0!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI5MTAyOC4wIKXMDSoASAFQAw%3D%3D" 
            target="_blank" 
            rel="noopener noreferrer"
            className="card-button"
            aria-label="View our location on Google Maps"
          >
            View Location
          </a>
        </div>
      </div>
    </div>
  )
}