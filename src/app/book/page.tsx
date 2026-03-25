'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BookPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const services = [
    'Classic Precision Cut',
    'Premium Beard Trim',
    'Signature Haircut & Beard',
    'Royal Shave',
    'Hair Treatment',
    'Kids Cut'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Store booking in localStorage or send to API
    const bookings = JSON.parse(localStorage.getItem('onlyBangersBookings') || '[]')
    bookings.push({ ...formData, id: Date.now(), createdAt: new Date().toISOString() })
    localStorage.setItem('onlyBangersBookings', JSON.stringify(bookings))
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setFormData({ name: '', email: '', phone: '', service: '', date: '', time: '' })
  }

  return (
    <div className="page-background">
      <div className="main-content max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Book an Appointment</h1>
          <p className="page-subtitle">Secure your spot with our expert barbers</p>
        </div>

        <div className="bg-premium p-6 md:p-8 rounded-2xl border border-premium-border">
          {submitted && (
            <div className="mb-6 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-300 text-center">
              Booking request sent! We'll contact you shortly.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-white mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-white mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-white mb-1">Service *</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
              >
                <option value="">Select a service</option>
                {services.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-white mb-1">Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-hover transition transform hover:scale-105"
            >
              Book Appointment
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-4">
            A 30% booking fee is required to secure your slot. You'll receive payment details after submitting.
          </p>
        </div>
      </div>
    </div>
  )
}