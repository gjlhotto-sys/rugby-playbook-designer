import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions — PlayForge',
  description: 'PlayForge Terms & Conditions',
}

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'ABOUT PLAYFORGE',
    body: `PlayForge ("the Service") is a rugby playbook design platform operated by Jacques Otto ("we", "us", "our"), based in South Africa. The Service allows rugby coaches to design, animate, save and share rugby plays and formations.`,
  },
  {
    title: 'ACCEPTANCE OF TERMS',
    body: `By creating an account or using PlayForge, you agree to these Terms & Conditions. If you do not agree, do not use the Service.`,
  },
  {
    title: 'ACCOUNTS',
    body: `• You must provide a valid email address to create an account
• You are responsible for maintaining the security of your account
• One account per user — accounts are non-transferable
• We reserve the right to suspend accounts that violate these terms`,
  },
  {
    title: 'SUBSCRIPTION PLANS',
    body: `Free Plan (Coach):
• Up to 3 saved plays
• No sharing or export features
• Access to basic play designer

Subscriber Plan:
• Monthly: R269/month (VAT inclusive)
• Yearly: R2,269/year (VAT inclusive)
• Unlimited saved plays
• Full sharing via link and WhatsApp
• MP4 video export
• PDF export
• Custom formations
• All future features included at no extra cost`,
  },
  {
    title: 'PAYMENT',
    body: `• Payments are processed securely via Lemon Squeezy, our payment processor and Merchant of Record
• All prices are in South African Rand (ZAR) and are VAT inclusive
• Lemon Squeezy acts as the Merchant of Record for all transactions — your payment relationship is with Lemon Squeezy
• Monthly subscriptions are billed every 30 days from the date of first payment
• Annual subscriptions are billed once per year from the date of first payment
• Payment methods accepted: credit/debit card via Lemon Squeezy's secure checkout
• Your card details are never stored by PlayForge — all payment data is handled by Lemon Squeezy`,
  },
  {
    title: 'CANCELLATION',
    body: `• You may cancel your subscription at any time via the Manage Subscription link in your PlayForge account, or by emailing gjlh.otto@gmail.com
• Cancellation takes effect at the end of the current billing period
• You will retain access to Subscriber features until the end of the paid period
• After cancellation your account reverts to the Free Plan and plays exceeding the free limit will be read-only (not deleted)`,
  },
  {
    title: 'REFUNDS',
    body: `• Monthly subscriptions are non-refundable once the billing period has started
• Annual subscriptions may be refunded within 14 days of purchase if the Service has not been substantially used
• Refund requests must be submitted to gjlh.otto@gmail.com
• As Lemon Squeezy is the Merchant of Record, refunds are processed by Lemon Squeezy in accordance with their refund policy
• We reserve the right to decline refund requests that do not meet these criteria`,
  },
  {
    title: 'DATA & PRIVACY',
    body: `• We store your email address and play data in a secure cloud database (Supabase)
• We do not sell your personal data to third parties
• Play data you create remains yours — you can export or delete it at any time
• Shared play links are publicly accessible to anyone with the link
• We use cookies for authentication purposes only`,
  },
  {
    title: 'ACCEPTABLE USE',
    body: `You agree not to:
• Use PlayForge for commercial resale or redistribution
• Share your account credentials with others
• Attempt to reverse engineer or copy the platform
• Upload or create content that is offensive, illegal or defamatory`,
  },
  {
    title: 'INTELLECTUAL PROPERTY',
    body: `• PlayForge, its design, logo and underlying technology are owned by Jacques Otto
• Play content you create remains your intellectual property
• By sharing a play via a public link, you grant PlayForge a non-exclusive licence to display that content via the share URL`,
  },
  {
    title: 'LIMITATION OF LIABILITY',
    body: `PlayForge is provided "as is" without warranties of any kind. We are not liable for any loss of data, loss of revenue or indirect damages arising from use of the Service. Our total liability is limited to the amount you paid in the last 30 days.`,
  },
  {
    title: 'CHANGES TO TERMS',
    body: `We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify subscribers of material changes via email.`,
  },
  {
    title: 'GOVERNING LAW',
    body: `These terms are governed by the laws of the Republic of South Africa. Any disputes will be resolved in South African courts.`,
  },
  {
    title: 'CONTACT',
    body: `Jacques Otto
Email: gjlh.otto@gmail.com
Website: playforge.co.za`,
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#ccc]">
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <Link
          href="/"
          className="mb-8 inline-block text-[14px] text-[#888] transition-colors hover:text-white"
        >
          ← Back to PlayForge
        </Link>

        <h1 className="text-[28px] font-semibold text-white">Terms &amp; Conditions</h1>
        <p className="mt-2 text-[14px] text-[#666]">Last updated: May 2026</p>

        <div className="mt-10 space-y-0">
          {SECTIONS.map((section, index) => (
            <section key={section.title}>
              {index > 0 && (
                <div
                  className="my-8 border-t border-[#2a2a2a]"
                  style={{ borderTopWidth: '0.5px' }}
                />
              )}
              <h2 className="text-[16px] font-medium text-white">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 whitespace-pre-line text-[14px] leading-[1.8] text-[#aaa]">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
