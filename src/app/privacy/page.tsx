export default function PrivacyPage() {
  return (
    <div className="page-background">
      <div className="main-content max-w-4xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">How we handle your data</p>
        </div>

        <div className="space-y-6">
          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">1. Information We Collect</h2>
            <p className="text-gray-300 mb-3">
              We collect information you provide directly to us, such as your name, email, phone number, and booking preferences when you schedule an appointment or purchase products.
            </p>
            <p className="text-gray-300">
              Automatically, we collect usage data like IP address, browser type, and pages visited to improve our services.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Process bookings and payments</li>
              <li>Send confirmations and reminders</li>
              <li>Improve our website and services</li>
              <li>Respond to inquiries</li>
            </ul>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">3. Data Sharing</h2>
            <p className="text-gray-300">
              We do not sell your personal information. We may share data with third‑party service providers (payment processors, email services) only as necessary to operate our business.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">4. Security</h2>
            <p className="text-gray-300">
              We use reasonable security measures to protect your data. However, no internet transmission is 100% secure.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">5. Your Rights</h2>
            <p className="text-gray-300">
              You may request access, correction, or deletion of your personal data by contacting us.
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