'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="page-background">
      <div className="main-content max-w-4xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">About Only Bangers</h1>
          <p className="page-subtitle">Every cut tells a story</p>
        </div>

        <div className="space-y-6">
          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">The Bedroom Beginning</h2>
            <p className="text-gray-300">
              Only Bangers wasn't born in a boardroom. It was born in my bedroom—Antonio Prince's bedroom—where the four walls felt both like a prison and a canvas.
            </p>
            <p className="text-gray-300 mt-3">
              Unemployment has a peculiar weight. It doesn't just sit on your shoulders; it settles in your bones. For months, I carried it. But in that quiet space, between job applications and fading hope, a different kind of vision started to form.
            </p>
            <div className="mt-4 p-4 bg-gold/10 border-l-4 border-gold rounded-r-lg">
              <p className="italic text-gold-light">
                "What if a barber's value wasn't just in the hands that hold the scissors, but in the eyes that watch the art?"
              </p>
            </div>
            <p className="text-gray-300 mt-3">
              I looked at the barbers in my community—artists in their own right—and saw a broken system. Talented hands, but invisible work. Masterful cuts, but no audience. Local legends with no way to become global inspirations.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">The Only Bangers Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-2">The Radical Truth</h3>
                <p className="text-gray-300 text-sm">
                  A barber is only as valuable as their least impressive cut. Harsh? Perhaps. True? Absolutely.
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  In the age of visibility, your worst work defines you more than your best.
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-2">The New Economy of Attention</h3>
                <p className="text-gray-300 text-sm">
                  Your cut's value = how many people see it × how many are inspired by it.
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  Not just a transaction. A broadcast. Not just a service. A performance. Not just a haircut. A story.
                </p>
              </div>
            </div>
            <p className="text-center text-white text-lg italic mt-4">
              We don't book appointments. We curate audiences.
            </p>
          </div>

          <div className="bg-premium p-6 rounded-2xl border border-premium-border">
            <h2 className="text-2xl font-semibold text-gold mb-3">Our Mission: Content as Currency</h2>
            <p className="text-gray-300">
              Only Bangers is more than a booking platform. It's an ecosystem where every snip of the scissors is potentially a viral moment. Where every fade has the chance to trend. Where barbers don't just build clientele—they build followings.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 border border-premium-border rounded-xl">
                <div className="text-4xl mb-2">🎥</div>
                <h4 className="font-bold text-white mb-1">Video-First Booking</h4>
                <p className="text-gray-400 text-sm">Every appointment includes tools to capture, edit, and share the transformation</p>
              </div>
              <div className="text-center p-4 border border-premium-border rounded-xl">
                <div className="text-4xl mb-2">📈</div>
                <h4 className="font-bold text-white mb-1">Skill Amplification</h4>
                <p className="text-gray-400 text-sm">Your work reaches beyond the barber chair to inspire the next generation</p>
              </div>
              <div className="text-center p-4 border border-premium-border rounded-xl">
                <div className="text-4xl mb-2">🤝</div>
                <h4 className="font-bold text-white mb-1">Community Valuation</h4>
                <p className="text-gray-400 text-sm">Your value grows with every view, like, and share of your craft</p>
              </div>
            </div>
            <p className="text-gray-300 mt-6">
              From my bedroom to your barber chair, we're rewriting what it means to be a barber in the digital age. Your hands were made for more than just cutting hair. They were made for creating movements.
            </p>
          </div>

          {/* Founder Section with Smaller Image */}
          <div className="text-center mt-8">
            {/* Founder Image - Smaller size */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold shadow-md">
                <img
                  src="/images/antonio-prince.jpg"
                  alt="Antonio Prince - Founder of Only Bangers"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/header-bg.png'; // fallback if image missing
                  }}
                />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Antonio Prince</h3>
            <p className="text-gray-300">
              Founder, Only Bangers<br />
              <span className="text-sm text-gray-400">Formerly unemployed visionary. Currently building the future of barbering.</span>
            </p>
            <div className="mt-6 pt-6 border-t border-premium-border">
              <p className="text-gold italic">
                "Your next cut shouldn't just change someone's look.<br />
                It should change someone's life. Starting with yours."
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/services" className="card-button inline-block">
              Book Your First Content-Cut
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}