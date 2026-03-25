'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WhatsAppCheckout from '@/components/WhatsAppCheckout'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  type: 'service' | 'product'
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    loadCart()
    
    const handleCartUpdate = () => loadCart()
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('onlyBangersCart')
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart))
        } catch (error) {
          console.error('Failed to load cart:', error)
          setCartItems([])
        }
      } else {
        setCartItems([])
      }
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id)
      return
    }

    const updatedCart = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
    
    setCartItems(updatedCart)
    localStorage.setItem('onlyBangersCart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const removeFromCart = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id)
    setCartItems(updatedCart)
    localStorage.setItem('onlyBangersCart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('onlyBangersCart')
    window.dispatchEvent(new Event('cartUpdated'))
    alert('Cart cleared!')
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateVAT = () => {
    return calculateSubtotal() * 0.15
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT()
  }

  if (showCheckout) {
    return <WhatsAppCheckout />
  }

  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Your Cart</h1>
          <p className="page-subtitle">
            {cartItems.length === 0 ? 'Your cart is empty' : `You have ${cartItems.length} item(s) in your cart`}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
            <h2>Your shopping cart is empty</h2>
            <p>Add some products or services to get started</p>
            <div className="empty-cart-actions">
              <Link href="/services" className="browse-btn">
                Browse Services
              </Link>
              <Link href="/products" className="browse-btn secondary">
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-container">
            <div className="cart-items-section">
              <div className="cart-items-header">
                <h2>Cart Items</h2>
                <button onClick={clearCart} className="clear-cart-btn">
                  Clear Cart
                </button>
              </div>
              
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <div className="image-placeholder" style={{ fontSize: '2rem' }}>
                        <svg fill="currentColor" viewBox="0 0 24 24" width="32" height="32">
                          {item.type === 'service' ? (
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          ) : (
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                          )}
                        </svg>
                      </div>
                    </div>
                    
                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <h3 className="cart-item-name">{item.name}</h3>
                        <span className="cart-item-type">{item.type}</span>
                      </div>
                      
                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="quantity-btn"
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="quantity-btn"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="cart-item-price">
                          <span className="price-per">R{item.price} each</span>
                          <span className="price-total">R{item.price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="remove-item-btn"
                      aria-label="Remove item"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-summary-section">
              <h2>Order Summary</h2>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>R{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>VAT (15%)</span>
                  <span>R{calculateVAT().toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="total-amount">R{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="checkout-info">
                <h3>WhatsApp Checkout</h3>
                <p>Complete your order via WhatsApp. Our team will contact you to confirm details and payment.</p>
              </div>
              
              <button 
                onClick={() => setShowCheckout(true)}
                className="whatsapp-checkout-btn"
              >
                <svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.181-1.234-6.162-3.477-8.411z"/>
                </svg>
                Proceed to WhatsApp Checkout
              </button>
              
              <div className="continue-shopping">
                <Link href="/services" className="continue-link">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}