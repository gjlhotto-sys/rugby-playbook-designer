'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ChevronDown,
  Gamepad2,
  Lightbulb,
  Pencil,
  Play,
  Save,
  Share2,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'

interface Step {
  icon: LucideIcon
  color: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: UserPlus,
    color: '#16a34a',
    title: 'Create Your Account',
    body: 'Head to playforge.co.za and click Sign Up. Enter your name, school and email address. Your account is free to start — no credit card needed.',
  },
  {
    icon: Gamepad2,
    color: '#a855f7',
    title: 'Choose Your Sport',
    body: 'PlayForge supports both Rugby and Netball. Click the sport badge next to the PlayForge logo to switch between sports. Your plays are saved separately for each sport.',
  },
  {
    icon: Users,
    color: '#2563eb',
    title: 'Set Up Your Formation',
    body: 'Click a formation button on the left panel (Scrum, Lineout, Both Teams, Kickoff or Free Play for rugby). Players appear on the field instantly in their correct positions.',
  },
  {
    icon: Pencil,
    color: '#f59e0b',
    title: 'Draw Your Play',
    body: 'Click Draw in the toolbar. Select an arrow type (Run, Pass, Curve etc). Click a player token, then click where you want them to move. Repeat for each player.',
  },
  {
    icon: Play,
    color: '#16a34a',
    title: 'Animate It',
    body: 'Click the green Animate button in the toolbar. Watch your players move through the play in sequence. Use Pause and Reset to control playback.',
  },
  {
    icon: Save,
    color: '#C0392B',
    title: 'Save Your Play',
    body: 'Click Save Play on the right panel. Give your play a name and select Attack, Defence or Set Piece. Your play is saved to the cloud and appears in My Plays.',
  },
  {
    icon: Share2,
    color: '#2563eb',
    title: 'Share with Your Team',
    body: 'Click Share Play to generate a link. Send it via WhatsApp to your players. They tap the link on their phone and watch the animation — no app download needed.',
  },
]

const TIPS: { title: string; body: string }[] = [
  {
    title: 'Use Phases',
    body: "Build multi-phase plays using the phase buttons (1-5) in the left panel. Each phase is a separate canvas. Use 'Copy Positions' to start Phase 2 where Phase 1 ended.",
  },
  {
    title: 'Zone Focus',
    body: 'Use Attack Zone, Mid Zone and Defence Zone buttons in the toolbar to zoom into the relevant part of the field. Great for detailed backline plays.',
  },
  {
    title: 'Save Formations',
    body: "Once you have your team's preferred lineup on the field, click Save Formation to save it for future plays. Load it instantly with one click.",
  },
  {
    title: 'Export as Video',
    body: 'Use Export MP4 to save your play as a video file. Perfect for sharing in WhatsApp groups or showing on a big screen at team meetings.',
  },
  {
    title: 'Match Stats (Pro)',
    body: 'Use the Match Stats feature during games and trials to track player performance. Generate instant reports to share with management and parents.',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do my players need to download an app?',
    a: 'No. Share links open directly in any mobile browser. Players just tap the link.',
  },
  {
    q: 'Can I use PlayForge on my iPad during training?',
    a: 'Yes. PlayForge works on tablets and phones. Landscape mode is recommended for the best experience.',
  },
  {
    q: 'How many plays can I save for free?',
    a: 'The free plan includes 3 saved plays. Upgrade to Pro for unlimited plays.',
  },
  {
    q: 'Can I use PlayForge for both Rugby and Netball?',
    a: 'Yes — PlayForge supports both sports. Switch between them using the sport selector.',
  },
  {
    q: 'What happens to my plays if I cancel?',
    a: 'Your plays are never deleted. They become read-only until you resubscribe.',
  },
]

export default function GettingStartedPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="mx-auto w-full max-w-[800px] px-5 py-10">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[32px]">
            Getting Started with PlayForge
          </h1>
          <p className="mt-2 text-[15px] text-[#888]">
            From zero to your first animated play in under 5 minutes
          </p>
        </header>

        {/* Steps */}
        <section className="space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 sm:flex-row sm:items-start sm:gap-4"
                style={{ borderWidth: '0.5px' }}
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C0392B] text-[16px] font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0" style={{ color: step.color }} strokeWidth={2} />
                    <h2 className="text-[16px] font-semibold text-white">{step.title}</h2>
                  </div>
                  <p className="text-[14px] text-[#aaa]" style={{ lineHeight: 1.8 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        {/* Pro Tips */}
        <section className="mt-12">
          <h2 className="mb-4 text-[20px] font-bold text-white">Pro Tips</h2>
          <div className="space-y-3">
            {TIPS.map((tip) => (
              <div
                key={tip.title}
                className="flex gap-3 rounded-xl border border-[#2a2a2a] bg-[#161616] p-4"
                style={{ borderWidth: '0.5px' }}
              >
                <Lightbulb className="h-5 w-5 shrink-0 text-[#f59e0b]" strokeWidth={2} />
                <div>
                  <h3 className="mb-1 text-[15px] font-semibold text-white">{tip.title}</h3>
                  <p className="text-[14px] text-[#aaa]" style={{ lineHeight: 1.8 }}>
                    {tip.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="mb-4 text-[20px] font-bold text-white">Common Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => {
              const open = openFaq === i
              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#161616]"
                  style={{ borderWidth: '0.5px' }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-[14px] font-medium text-white">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#888] transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-4">
                      <p className="text-[14px] text-[#aaa]" style={{ lineHeight: 1.8 }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-xl border border-[#2a2a2a] bg-[#161616] p-6 text-center" style={{ borderWidth: '0.5px' }}>
          <h2 className="mb-4 text-[20px] font-bold text-white">Ready to get started?</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-[#16a34a] px-5 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create Free Account
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] px-5 py-3 text-[14px] font-semibold text-[#ccc] transition-colors hover:text-white"
            >
              View Pricing
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] px-5 py-3 text-[14px] font-semibold text-[#ccc] transition-colors hover:text-white"
            >
              Back to App
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
