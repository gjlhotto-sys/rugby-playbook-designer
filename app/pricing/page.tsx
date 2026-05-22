'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, X } from 'lucide-react'

const FREE_FEATURES = [
  { label: 'Up to 3 saved plays', included: true },
  { label: 'Full play designer', included: true },
  { label: 'All formations', included: true },
  { label: 'Phase animation', included: true },
  { label: 'Share plays', included: false },
  { label: 'MP4 export', included: false },
  { label: 'PDF export', included: false },
  { label: 'Custom formations', included: false },
] as const

const SUBSCRIBER_FEATURES = [
  'Unlimited saved plays',
  'Full play designer',
  'All formations',
  'Phase animation',
  'Share plays via link & WhatsApp',
  'MP4 video export',
  'PDF export',
  'Custom formations',
  'Priority support',
  'All future features included',
] as const

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: "Yes. Cancel before your next billing date and you won't be charged again. You keep access until the end of your paid period.",
  },
  {
    q: 'What happens to my plays if I cancel?',
    a: 'Your plays are never deleted. If you go back to the free plan, plays beyond the 3-play limit become read-only until you resubscribe.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. All payments are processed by PayFast, a leading South African payment gateway. We never store your card details.',
  },
  {
    q: 'Do you offer team or school discounts?',
    a: 'We are working on school and team plans. Email gjlh.otto@gmail.com to discuss options.',
  },
] as const

function FeatureRow({
  label,
  included,
}: {
  label: string
  included: boolean
}) {
  return (
    <li
      className={`flex items-center gap-2 text-[14px] ${
        included ? 'text-[#aaa]' : 'text-[#555]'
      }`}
    >
      {included ? (
        <Check className="h-4 w-4 shrink-0 text-[#86efac]" strokeWidth={2.5} />
      ) : (
        <X className="h-4 w-4 shrink-0 text-[#444]" strokeWidth={2.5} />
      )}
      {label}
    </li>
  )
}

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#ccc]">
      <div className="mx-auto max-w-[900px] px-5 py-[60px]">
        <header className="text-center">
          <h1 className="text-[32px] font-semibold text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-[16px] text-[#666]">
            Built for rugby coaches. Cancel anytime.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:items-stretch">
          {/* Free */}
          <div
            className="flex flex-col rounded-xl border border-[#2a2a2a] bg-[#161616] p-6"
            style={{ borderWidth: '0.5px' }}
          >
            <p className="text-[14px] font-medium text-white">Coach</p>
            <p className="mt-2 text-[40px] font-bold leading-none text-white">Free</p>
            <p className="mt-1 text-[14px] text-[#666]">Forever free</p>
            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {FREE_FEATURES.map((f) => (
                <FeatureRow key={f.label} label={f.label} included={f.included} />
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-8 block w-full rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] py-3 text-center text-[14px] font-medium text-white transition-colors hover:bg-[#252525]"
              style={{ borderWidth: '0.5px' }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Subscriber */}
          <div className="relative flex flex-col md:-mt-2 md:mb-[-8px]">
            <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#C0392B] px-3 py-1 text-[11px] font-medium text-white">
              Most Popular
            </span>
            <div
              className="flex h-full flex-col rounded-xl border-2 border-[#C0392B] bg-[#161616] p-6 shadow-lg shadow-black/30 md:py-8"
            >
              <p className="text-[14px] font-medium text-white">Subscriber</p>

              <div
                className="mt-4 inline-flex rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-1"
                style={{ borderWidth: '0.5px' }}
              >
                <button
                  type="button"
                  onClick={() => setBilling('monthly')}
                  className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    billing === 'monthly'
                      ? 'bg-[#C0392B] text-white'
                      : 'text-[#888] hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling('annual')}
                  className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    billing === 'annual'
                      ? 'bg-[#C0392B] text-white'
                      : 'text-[#888] hover:text-white'
                  }`}
                >
                  Annual
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-2">
                {billing === 'monthly' ? (
                  <>
                    <span className="text-[40px] font-bold leading-none text-white">
                      R299
                    </span>
                    <span className="pb-1 text-[14px] text-[#666]">per month</span>
                  </>
                ) : (
                  <>
                    <span className="text-[40px] font-bold leading-none text-white">
                      R2,499
                    </span>
                    <span className="pb-1 text-[14px] text-[#666]">per year</span>
                    <span className="mb-1 rounded-full bg-[#16a34a]/20 px-2 py-0.5 text-[11px] font-medium text-[#86efac]">
                      Save 30%
                    </span>
                  </>
                )}
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {SUBSCRIBER_FEATURES.map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-[14px] text-[#aaa]"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[#86efac]" strokeWidth={2.5} />
                    {label}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-8 block w-full rounded-lg bg-[#C0392B] py-3 text-center text-[14px] font-medium text-white transition-colors hover:bg-[#a93226]"
              >
                Start Subscription
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[12px] text-[#555]">
          All plans include a 14-day refund policy on annual subscriptions
        </p>
        <p className="mt-2 text-center text-[12px] text-[#555]">
          Questions? Email{' '}
          <a
            href="mailto:gjlh.otto@gmail.com"
            className="text-[#888] hover:text-white"
          >
            gjlh.otto@gmail.com
          </a>
        </p>

        <section className="mt-16">
          <h2 className="text-[20px] font-semibold text-white">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-2">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#161616]"
                  style={{ borderWidth: '0.5px' }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px] font-medium text-white"
                  >
                    {item.q}
                    <span className="text-[#666]">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="border-t border-[#2a2a2a] px-4 py-3 text-[14px] leading-relaxed text-[#aaa]"
                      style={{ borderTopWidth: '0.5px' }}
                    >
                      {item.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <Link
          href="/"
          className="mt-12 inline-block text-[14px] text-[#888] transition-colors hover:text-white"
        >
          ← Back to PlayForge
        </Link>
      </div>
    </main>
  )
}
