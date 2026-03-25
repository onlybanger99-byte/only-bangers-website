'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  type: 'service' | 'product'
}

export default function WhatsAppCheckout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('onlyBangersCart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [])

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return subtotal + subtotal * 0.15
  }

  const generateWhatsAppMessage = () => {
    const orderSummary = cartItems.map(item =>
      `${item.name} x${item.quantity} – R${item.price * item.quantity}`
    ).join('\n')
    const total = calculateTotal().toFixed(2)
    return `*New Order from Only Bangers*\n\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n\n*Order Items:*\n${orderSummary}\n\n*Total (incl. VAT):* R${total}\n\nPlease confirm availability and payment details.`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone) {
      alert('Please fill in your name and phone number')
      return
    }
    setSubmitting(true)
    const message = encodeURIComponent(generateWhatsAppMessage())
    const whatsappUrl = `https://wa.me/27699864730?text=${message}`
    window.open(whatsappUrl, '_blank')
    setSubmitting(false)
    // Optionally clear cart after checkout
    localStorage.removeItem('onlyBangersCart')
    window.dispatchEvent(new Event('cartUpdated'))
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-background">
        <div className="main-content text-center">
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <Link href="/services" className="browse-btn mt-4">Browse Services</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-background">
      <div className="main-content max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">WhatsApp Checkout</h1>
          <p className="page-subtitle">Complete your order via WhatsApp</p>
        </div>

        <div className="bg-premium p-6 rounded-2xl border border-premium-border">
          <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
          <div className="space-y-2 mb-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between text-gray-300">
                <span>{item.name} x{item.quantity}</span>
                <span>R{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-premium-border pt-2 mt-2">
              <div className="flex justify-between font-bold text-white">
                <span>Total (incl. VAT)</span>
                <span className="text-gold">R{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-1">Your Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-white mb-1">Phone Number *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-hover transition transform hover:scale-105 disabled:opacity-50"
            >
              {submitting ? 'Opening WhatsApp...' : 'Send Order via WhatsApp'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/cart" className="text-gold hover:underline">
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}