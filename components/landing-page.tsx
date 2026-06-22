'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ClipboardList,
  Menu,
  Pencil,
  Play,
  Share2,
  Smartphone,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/* --------------------------- Scroll fade-in ---------------------------- */

function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------- Logo ---------------------------------- */

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#C0392B] text-white">
        <Zap className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <span className="text-[17px] font-bold tracking-tight text-white">PlayForge</span>
    </Link>
  )
}

/* ------------------------------- Data ---------------------------------- */

const FEATURES: { icon: LucideIcon; color: string; title: string; body: string }[] = [
  {
    icon: Pencil,
    color: '#2563eb',
    title: 'Design in Minutes',
    body: 'Drag players onto the field, draw arrows for runs, passes and kicks. Build any play in minutes with an intuitive touch-friendly interface.',
  },
  {
    icon: Play,
    color: '#16a34a',
    title: 'Bring Plays to Life',
    body: 'Hit Animate and watch your players move through the play in real time. Multi-phase sequences show the full picture.',
  },
  {
    icon: Share2,
    color: '#25D366',
    title: 'Share via WhatsApp',
    body: 'Generate a shareable link instantly. Players tap it on their phone and watch the animation — no app download ever required.',
  },
  {
    icon: Trophy,
    color: '#f59e0b',
    title: 'Rugby & Netball',
    body: 'Switch between a full rugby field and netball court with one tap. Separate plays, positions and formations for each sport.',
  },
  {
    icon: ClipboardList,
    color: '#a855f7',
    title: 'Live Match Stats',
    body: 'Track player performance during matches and trials in real time. Generate instant reports to share with management and parents.',
  },
  {
    icon: Smartphone,
    color: '#ec4899',
    title: 'Phone, Tablet & Desktop',
    body: 'Design on your laptop, present on a tablet at training, track stats on your phone at the game. PlayForge works everywhere.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Build Your Play',
    body: 'Choose a formation, place your players and draw movement arrows. Run, pass, kick, ruck — every arrow type you need.',
  },
  {
    num: '02',
    title: 'Animate & Refine',
    body: "Watch the play animate in real time. Add phases for multi-phase sequences. Adjust until it's exactly right.",
  },
  {
    num: '03',
    title: 'Share Instantly',
    body: 'One click generates a shareable link. Send to your team via WhatsApp. They watch it on their phone.',
  },
]

const RUGBY_FEATURES = [
  'Full rugby field (100m)',
  '15-player formations',
  'Scrum, Lineout, Kickoff presets',
  'Run, Pass, Kick, Ruck, Reposition arrows',
  'Multi-phase play builder',
  'Match & trial stats tracker',
]

const NETBALL_FEATURES = [
  'Full netball court with thirds',
  '7-position setup (GS to GK)',
  'Zone focus (attacking/centre/defending)',
  'Save custom centre pass formations',
  'Live match stats with goal scoring %',
  'WhatsApp & PDF reports',
]

/* --------------------------- Field mockup ------------------------------ */

function FieldMockup() {
  return (
    <svg viewBox="0 0 320 200" className="h-auto w-full" role="img" aria-label="PlayForge designer preview">
      {/* panels */}
      <rect x="0" y="0" width="320" height="200" rx="10" fill="#161616" stroke="#2a2a2a" strokeWidth="0.5" />
      <rect x="0" y="0" width="56" height="200" rx="10" fill="#141414" />
      <rect x="264" y="0" width="56" height="200" rx="10" fill="#141414" />
      {/* left panel tokens */}
      {[28, 50, 72, 94, 116].map((y) => (
        <g key={`l${y}`}>
          <circle cx="20" cy={y} r="6" fill="#2563eb" />
          <rect x="30" y={y - 3} width="18" height="6" rx="2" fill="#222" />
        </g>
      ))}
      {/* field */}
      <rect x="62" y="10" width="196" height="180" rx="6" fill="#0a3d12" />
      {[42, 74, 106, 138, 170].map((x) => (
        <line key={x} x1={x + 20} y1="12" x2={x + 20} y2="188" stroke="#1c5a26" strokeWidth="1" />
      ))}
      <line x1="160" y1="12" x2="160" y2="188" stroke="#2f7a3c" strokeWidth="1.5" />
      {/* arrows */}
      <path d="M120 150 Q150 110 185 80" fill="none" stroke="#EAB308" strokeWidth="2" strokeDasharray="0" markerEnd="url(#arrow)" />
      <path d="M150 60 L210 50" fill="none" stroke="#93c5fd" strokeWidth="2" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="#EAB308" />
        </marker>
      </defs>
      {/* player tokens */}
      {[
        { x: 120, y: 150, c: '#2563eb', n: '9' },
        { x: 150, y: 60, c: '#2563eb', n: '10' },
        { x: 185, y: 80, c: '#2563eb', n: '12' },
        { x: 210, y: 50, c: '#2563eb', n: '13' },
        { x: 100, y: 100, c: '#C0392B', n: '7' },
        { x: 175, y: 130, c: '#C0392B', n: '8' },
      ].map((p) => (
        <g key={`${p.n}-${p.x}`}>
          <circle cx={p.x} cy={p.y} r="8" fill={p.c} stroke="#fff" strokeWidth="1" />
          <text x={p.x} y={p.y + 3} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold">
            {p.n}
          </text>
        </g>
      ))}
      {/* right panel rows */}
      {[24, 44, 64, 84].map((y) => (
        <rect key={`r${y}`} x="274" y={y} width="36" height="10" rx="3" fill="#222" />
      ))}
      <rect x="274" y="160" width="36" height="14" rx="4" fill="#C0392B" />
    </svg>
  )
}

/* --------------------------- Phone mockup ------------------------------ */

function PhoneMockup() {
  return (
    <svg viewBox="0 0 120 200" className="mx-auto h-40 w-auto" role="img" aria-label="Phone share preview">
      <rect x="20" y="4" width="80" height="192" rx="14" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1" />
      <rect x="26" y="16" width="68" height="120" rx="6" fill="#0a3d12" />
      <circle cx="50" cy="70" r="6" fill="#2563eb" />
      <circle cx="72" cy="90" r="6" fill="#C0392B" />
      <path d="M50 70 Q62 80 72 90" fill="none" stroke="#EAB308" strokeWidth="2" />
      <rect x="30" y="146" width="60" height="10" rx="3" fill="#25D366" />
      <rect x="34" y="164" width="52" height="6" rx="2" fill="#222" />
    </svg>
  )
}

/* ------------------------------ Section -------------------------------- */

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-[26px] font-bold tracking-tight text-white sm:text-[34px]">{title}</h2>
      {subtitle && <p className="mt-2 text-[15px] text-[#888]">{subtitle}</p>}
    </div>
  )
}

/* ------------------------------ Landing -------------------------------- */

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = 'PlayForge — Rugby & Netball Play Designer for Coaches'
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* NAVBAR */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#2a2a2a] bg-[#0f0f0f]/90 backdrop-blur" style={{ borderBottomWidth: '0.5px' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/getting-started" className="text-[14px] text-[#aaa] transition-colors hover:text-white">
              Getting Started
            </Link>
            <Link href="/pricing" className="text-[14px] text-[#aaa] transition-colors hover:text-white">
              Pricing
            </Link>
            <Link href="/login" className="text-[14px] text-[#aaa] transition-colors hover:text-white">
              Log In
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#C0392B] px-4 py-2 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start Free
            </Link>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2a2a2a] text-[#aaa] md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] px-5 py-3 md:hidden" style={{ borderTopWidth: '0.5px' }}>
            <div className="flex flex-col gap-3">
              <Link href="/getting-started" className="text-[14px] text-[#aaa]" onClick={() => setMenuOpen(false)}>
                Getting Started
              </Link>
              <Link href="/pricing" className="text-[14px] text-[#aaa]" onClick={() => setMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/login" className="text-[14px] text-[#aaa]" onClick={() => setMenuOpen(false)}>
                Log In
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-[#C0392B] px-4 py-2 text-center text-[14px] font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pt-24 pb-16" style={{ background: '#0a1a0a' }}>
        {/* faint field lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 78px, #16a34a 78px, #16a34a 79px)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <FadeIn>
            <span className="inline-block rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-1.5 text-[13px] text-[#888]" style={{ borderWidth: '0.5px' }}>
              🏉 Rugby &nbsp;•&nbsp; 🏐 Netball
            </span>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 className="mt-6 text-[36px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[56px]">
              Design Plays That
              <br />
              Actually <span className="text-[#C0392B]">Move</span>
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="mx-auto mt-5 max-w-[560px] text-[16px] text-[#aaa] sm:text-[18px]">
              The coaching tool built for rugby and netball coaches. Design plays, animate them, and share instantly with your team via WhatsApp.
            </p>
          </FadeIn>
          <FadeIn delay={240}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-xl bg-[#C0392B] px-8 py-4 text-[16px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                Start for Free →
              </Link>
              <Link
                href="/getting-started"
                className="w-full rounded-xl border border-[#2a2a2a] px-8 py-4 text-[16px] font-medium text-[#888] transition-colors hover:text-white sm:w-auto"
              >
                See How It Works
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={320}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px] text-[#555]">
              <span>✓ Free plan available</span>
              <span>✓ No credit card needed</span>
              <span>✓ Works on phone &amp; tablet</span>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="relative mx-auto mt-12 max-w-[900px]">
              <div className="absolute inset-x-8 bottom-0 h-24 rounded-full bg-[#16a34a] opacity-20 blur-3xl" />
              <div className="relative rounded-2xl border border-[#2a2a2a] bg-[#161616] p-3 shadow-2xl" style={{ borderWidth: '0.5px' }}>
                <FieldMockup />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 2: FEATURES */}
      <section className="bg-[#0f0f0f] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading
              title="Everything a coach needs"
              subtitle="Built from the ground up for rugby and netball coaches"
            />
          </FadeIn>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <FadeIn key={f.title} delay={(i % 3) * 80}>
                  <div className="group h-full rounded-2xl border border-[#2a2a2a] bg-[#161616] p-6 transition-colors duration-200 hover:border-[#444]" style={{ borderWidth: '0.5px' }}>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${f.color}1a` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: f.color }} strokeWidth={2} />
                    </div>
                    <h3 className="mt-3 text-[16px] font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-[14px] text-[#888]" style={{ lineHeight: 1.7 }}>
                      {f.body}
                    </p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="bg-[#080808] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading title="From blank field to WhatsApp in minutes" />
          </FadeIn>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <FadeIn key={s.num} delay={i * 100}>
                <div className="relative text-center md:text-left">
                  <div className="text-[48px] font-extrabold leading-none text-[#C0392B]">{s.num}</div>
                  <h3 className="mt-3 text-[18px] font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-[14px] text-[#888]" style={{ lineHeight: 1.7 }}>
                    {s.body}
                  </p>
                  <div className="mt-5 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3" style={{ borderWidth: '0.5px' }}>
                    {i === 2 ? <PhoneMockup /> : <FieldMockup />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="absolute right-[-22px] top-6 hidden text-[#333] md:block">
                      <span className="text-[20px]">- - -</span>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: SPORTS */}
      <section className="bg-[#0f0f0f] px-5 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          <FadeIn>
            <SportCard
              emoji="🏉"
              title="Rugby"
              bg="#0a1a0a"
              border="#16a34a"
              features={RUGBY_FEATURES}
              cta="Design Rugby Plays →"
            />
          </FadeIn>
          <FadeIn delay={100}>
            <SportCard
              emoji="🏐"
              title="Netball"
              bg="#0a0a1a"
              border="#a855f7"
              features={NETBALL_FEATURES}
              cta="Design Netball Plays →"
            />
          </FadeIn>
        </div>
      </section>

      {/* SECTION 5: SOCIAL PROOF */}
      <section className="bg-[#080808] px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <SectionHeading title="Built for coaches, by a coach" />
          </FadeIn>
          <FadeIn delay={80}>
            <blockquote className="mx-auto max-w-[700px] rounded-2xl border border-[#2a2a2a] bg-[#161616] p-10" style={{ borderWidth: '0.5px' }}>
              <span className="text-[40px] font-serif leading-none text-[#C0392B]">“</span>
              <p className="mt-2 text-[18px] italic text-[#ccc]" style={{ lineHeight: 1.7 }}>
                PlayForge has completely changed how I prepare my team. I can build a play in minutes and share it to the WhatsApp group before the players even get home from training.
              </p>
              <footer className="mt-4 text-[14px] text-[#666]">— Rugby Coach, Western Cape</footer>
            </blockquote>
          </FadeIn>
          <p className="mt-8 text-center text-[12px] text-[#555]">
            Trusted by coaches at schools across South Africa
          </p>
        </div>
      </section>

      {/* SECTION 6: PRICING PREVIEW */}
      <section className="bg-[#0f0f0f] px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <SectionHeading title="Simple pricing" subtitle="Start free. Upgrade when you're ready." />
          </FadeIn>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FadeIn>
              <div className="flex h-full flex-col rounded-2xl border border-[#2a2a2a] bg-[#161616] p-6" style={{ borderWidth: '0.5px' }}>
                <h3 className="text-[16px] font-semibold text-white">Free Forever</h3>
                <p className="mt-2 text-[32px] font-extrabold text-white">R0</p>
                <p className="mt-2 text-[14px] text-[#888]">3 saved plays, basic designer</p>
                <Link
                  href="/login"
                  className="mt-6 rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] px-5 py-3 text-center text-[14px] font-semibold text-[#ccc] transition-colors hover:text-white"
                >
                  Get Started Free
                </Link>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="relative flex h-full flex-col rounded-2xl border bg-[#161616] p-6" style={{ borderColor: '#C0392B', borderWidth: '1px' }}>
                <span className="absolute -top-3 left-6 rounded-full bg-[#C0392B] px-3 py-0.5 text-[11px] font-semibold text-white">
                  Most Popular
                </span>
                <h3 className="text-[16px] font-semibold text-white">Pro</h3>
                <p className="mt-2 text-[32px] font-extrabold text-white">
                  R269<span className="text-[14px] font-normal text-[#888]">/month</span>
                </p>
                <p className="mt-1 text-[13px] text-[#888]">or R2,269/year</p>
                <p className="mt-2 text-[14px] text-[#888]">
                  Everything in Free + unlimited plays, sharing, export and stats
                </p>
                <Link
                  href="/login"
                  className="mt-6 rounded-lg bg-[#C0392B] px-5 py-3 text-center text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Start Pro
                </Link>
              </div>
            </FadeIn>
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-[14px] text-[#888] transition-colors hover:text-white">
              See full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section className="relative overflow-hidden px-5 py-24" style={{ background: '#0a1a0a' }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 78px, #16a34a 78px, #16a34a 79px)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <FadeIn>
            <h2 className="text-[28px] font-bold tracking-tight text-white sm:text-[40px]">
              Ready to transform how you coach?
            </h2>
            <p className="mx-auto mt-4 max-w-[600px] text-[16px] text-[#888]">
              Join coaches across South Africa using PlayForge to design, share and analyse plays like never before.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-xl bg-[#C0392B] px-8 py-4 text-[16px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                Start for Free →
              </Link>
              <Link
                href="/pricing"
                className="w-full rounded-xl border border-[#2a2a2a] px-8 py-4 text-[16px] font-medium text-[#888] transition-colors hover:text-white sm:w-auto"
              >
                View Pricing
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12px] text-[#555]">
              <span>✓ Free plan</span>
              <span>✓ No credit card</span>
              <span>✓ Cancel anytime</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2a2a2a] bg-[#161616] px-5 py-8" style={{ borderTopWidth: '0.5px' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-[13px] text-[#888]">
              The coaching tool for rugby and netball
            </p>
            <p className="mt-2 text-[12px] text-[#555]">© 2026 PlayForge. All rights reserved.</p>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#666]">PlayForge</p>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/getting-started" className="text-[#888] transition-colors hover:text-white">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[#888] transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#888] transition-colors hover:text-white">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <a href="mailto:gjlh.otto@gmail.com" className="text-[#888] transition-colors hover:text-white">
                  gjlh.otto@gmail.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#666]">For Coaches</p>
            <ul className="space-y-2 text-[13px] text-[#888]">
              <li>Rugby Plays</li>
              <li>Netball Plays</li>
              <li>Match Stats</li>
              <li>Share to WhatsApp</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SportCard({
  emoji,
  title,
  bg,
  border,
  features,
  cta,
}: {
  emoji: string
  title: string
  bg: string
  border: string
  features: string[]
  cta: string
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border p-6" style={{ background: bg, borderColor: border, borderWidth: '0.5px' }}>
      <div className="text-[40px]">{emoji}</div>
      <h3 className="mt-2 text-[22px] font-bold text-white">{title}</h3>
      <ul className="mt-4 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[14px] text-[#bbb]">
            <span style={{ color: border }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className="mt-6 rounded-lg px-5 py-3 text-center text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: border }}
      >
        {cta}
      </Link>
    </div>
  )
}
