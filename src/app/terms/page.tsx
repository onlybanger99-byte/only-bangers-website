export default function TermsPage() {
  return (
    <div className="page-background">
      <div className="main-content max-w-4xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">Our terms and conditions</p>
        </div>

        <div className="space-y-6">
          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By using our website or booking an appointment, you agree to these Terms of Service.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">2. Booking & Payment</h2>
            <p className="text-gray-300 mb-3">
              A 30% booking fee is required to secure your appointment. This fee is non‑refundable after 24 hours from booking.
            </p>
            <p className="text-gray-300">
              The remaining balance is payable in person. All prices are in South African Rand (ZAR).
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">3. Cancellation Policy</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Cancel within 24 hours of booking → full refund of booking fee</li>
              <li>Cancel after 24 hours → booking fee forfeited</li>
              <li>No‑show → booking fee forfeited</li>
            </ul>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">4. Service Providers</h2>
            <p className="text-gray-300">
              Our barbers are carefully selected for their skill. Some may be in training. By booking, you acknowledge that not all barbers may hold formal licenses.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">5. Liability</h2>
            <p className="text-gray-300">
              Only Bangers is not liable for allergic reactions, dissatisfaction with agreed‑upon styles, or lost/damaged personal items.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">6. Changes to Terms</h2>
            <p className="text-gray-300">
              We may update these terms at any time. Continued use of our services constitutes acceptance of the new terms.
            </p>
          </div>

          <div className="text-center text-gray-400 text-sm mt-8">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}