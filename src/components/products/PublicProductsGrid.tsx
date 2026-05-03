'use client'

import { useMemo, useState } from 'react'
import styles from '@/app/products/products.module.css'

type ProductSummary = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  imageUrl: string | null
  category: string
  stockQuantity: number
}

export function PublicProductsGrid({
  products,
}: {
  products: ProductSummary[]
}) {
  const [filter, setFilter] = useState('all')
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
    [products]
  )

  const addToCart = (product: ProductSummary) => {
    const cartItem = {
      ...product,
      quantity: 1,
      type: 'product' as const,
    }

    const existingCart = JSON.parse(localStorage.getItem('onlyBangersCart') || '[]')
    const existingItemIndex = existingCart.findIndex((item: ProductSummary & { quantity: number }) => item.id === product.id)

    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }

    localStorage.setItem('onlyBangersCart', JSON.stringify(existingCart))
    window.dispatchEvent(new Event('cartUpdated'))
    alert(`${product.name} added to cart!`)
  }

  const filteredProducts = filter === 'all' ? products : products.filter((product) => product.category === filter)

  return (
    <>
      <div className="filter-section">
        <div className="filter-buttons">
          <button onClick={() => setFilter('all')} className={`filter-btn ${filter === 'all' ? 'active' : ''}`}>
            All Products
          </button>
          {categories.map((category) => (
            <button key={category} onClick={() => setFilter(category)} className={`filter-btn ${filter === category ? 'active' : ''}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 className="card-title">{product.name}</h3>
                <span className={styles.categoryBadge}>{product.category || 'Product'}</span>
              </div>

              <p className="card-description">{product.description}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span className="card-price">R{product.price}</span>
                <button onClick={() => addToCart(product)} className="card-button">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
