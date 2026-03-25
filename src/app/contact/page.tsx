'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you'd send this to an API
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">Get in touch with the Only Bangers team</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-bold text-gold mb-4">Visit Our Shop</h2>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>123 Barber Street, Sandton, Johannesburg</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+27699864730" className="hover:text-gold transition">+27 69 986 4730</a>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:onlybangers99@gmail.com" className="hover:text-gold transition">onlybangers99@gmail.com</a>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-2">Business Hours</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span className="text-gold">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="text-gold">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="text-gold">Closed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-bold text-gold mb-4">Send a Message</h2>
            {submitted && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-300 text-center">
                Message sent successfully!
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-1">Name</label>
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
                <label className="block text-white mb-1">Email</label>
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
                <label className="block text-white mb-1">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-premium-border rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-hover transition transform hover:scale-105"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Google Maps Embed */}
        <div className="mt-8">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3584.958528500352!2d27.834477!3d-26.399284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e95a3d1f8b5f8a9%3A0x5b4d9c7f3e2a1c8d!2s123%20Barber%20Street%2C%20Sandton%2C%20Johannesburg!5e0!3m2!1sen!2sza!4v1700000000000!5m2!1sen!2sza"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: '1rem' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="border border-premium-border"
          />
        </div>
      </div>
    </div>
  )
}