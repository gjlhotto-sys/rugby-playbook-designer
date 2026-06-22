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
  Star,
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
      <rect x="0" y="0" width="46" height="200" rx="10" fill="#141414" />
      <rect x="274" y="0" width="46" height="200" rx="10" fill="#141414" />
      {/* left panel tokens */}
      {[26, 48, 70, 92, 114, 136].map((y) => (
        <g key={`l${y}`}>
          <circle cx="16" cy={y} r="6" fill="#2563eb" />
          <rect x="26" y={y - 3} width="14" height="6" rx="2" fill="#222" />
        </g>
      ))}
      {/* field */}
      <rect x="52" y="8" width="216" height="184" rx="6" fill="#0a3d12" />
      {[34, 70, 106, 142, 178, 214].map((x) => (
        <line key={x} x1={x + 18} y1="10" x2={x + 18} y2="190" stroke="#1c5a26" strokeWidth="1" />
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
        <rect key={`r${y}`} x="282" y={y} width="30" height="10" rx="3" fill="#222" />
      ))}
      <rect x="282" y="160" width="30" height="14" rx="4" fill="#C0392B" />
    </svg>
  )
}

/* --------------------------- Phone mockup ------------------------------ */

function PhoneMockup() {
  return (
    <svg viewBox="0 0 150 200" className="mx-auto h-44 w-auto" role="img" aria-label="WhatsApp share preview">
      {/* phone frame */}
      <rect x="25" y="4" width="100" height="192" rx="16" fill="#0b141a" stroke="#2a2a2a" strokeWidth="1.5" />
      {/* chat header */}
      <rect x="25" y="4" width="100" height="18" rx="16" fill="#1f2c33" />
      <rect x="25" y="13" width="100" height="9" fill="#1f2c33" />
      <circle cx="36" cy="13" r="5" fill="#25D366" />
      <rect x="45" y="10" width="40" height="5" rx="2" fill="#33434c" />
      {/* WhatsApp message bubble */}
      <rect x="33" y="32" width="84" height="118" rx="8" fill="#25D366" />
      {/* tail */}
      <path d="M117 40 L123 36 L117 48 Z" fill="#25D366" />
      {/* message text line 1 */}
      <text x="40" y="46" fontSize="6.5" fill="#06310f" fontWeight="bold">🏉 Check out our</text>
      <text x="40" y="55" fontSize="6.5" fill="#06310f" fontWeight="bold">new play!</text>
      {/* field thumbnail */}
      <rect x="40" y="60" width="70" height="46" rx="4" fill="#0a3d12" />
      <line x1="75" y1="62" x2="75" y2="104" stroke="#1c5a26" strokeWidth="1" />
      <circle cx="55" cy="92" r="4" fill="#2563eb" />
      <circle cx="92" cy="74" r="4" fill="#C0392B" />
      <path d="M55 92 Q72 80 92 74" fill="none" stroke="#EAB308" strokeWidth="1.5" markerEnd="url(#wa-arrow)" />
      <defs>
        <marker id="wa-arrow" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0 0 L5 2.5 L0 5 Z" fill="#EAB308" />
        </marker>
      </defs>
      {/* link */}
      <text x="40" y="118" fontSize="5.5" fill="#0a4a1a">playforge.co.za/play/abc123</text>
      {/* tap to watch */}
      <text x="40" y="130" fontSize="5.8" fill="#06310f" fontWeight="bold">Tap to watch ▶</text>
      {/* timestamp */}
      <text x="106" y="144" fontSize="4.5" fill="#0a4a1a" textAnchor="end">09:24 ✓✓</text>
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.title = 'PlayForge — Rugby & Netball Play Designer for Coaches'
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* NAVBAR */}
      <nav
        className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
        style={{
          background: scrolled ? 'rgba(15, 15, 15, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          borderBottom: scrolled ? '0.5px solid #2a2a2a' : '0.5px solid transparent',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
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
            <div className="relative mx-auto mt-14 max-w-[1000px]">
              <div
                className="relative rounded-2xl border border-[#2a2a2a] bg-[#161616] p-5 sm:p-6"
                style={{
                  borderWidth: '0.5px',
                  boxShadow:
                    '0 40px 80px rgba(192, 57, 43, 0.15), 0 0 120px rgba(22, 163, 74, 0.08)',
                }}
              >
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
          <FadeIn delay={80}>
            <div className="mx-auto mb-12 flex max-w-2xl items-stretch justify-center">
              {[
                { num: '2', label: 'Sports' },
                { num: '15+', label: 'Arrow Types' },
                { num: 'Real-time', label: 'Stats' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  {i > 0 && <div className="mx-5 h-10 w-px bg-[#2a2a2a] sm:mx-8" />}
                  <div className="text-center">
                    <div className="text-[24px] font-bold text-white sm:text-[32px]">{stat.num}</div>
                    <div className="mt-0.5 text-[12px] text-[#666]">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
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
      <section className="bg-[#080808]" style={{ padding: '80px 24px' }}>
        <div className="mx-auto max-w-[700px] text-center">
          <FadeIn>
            <div
              className="leading-none text-[#C0392B]"
              style={{ fontFamily: 'Georgia, serif', fontSize: '72px' }}
            >
              &ldquo;
            </div>
            <p className="-mt-4 italic text-[#ccc]" style={{ fontSize: '20px', lineHeight: 1.7 }}>
              PlayForge has completely changed how I prepare my team. I can build a play in minutes and share it to the WhatsApp group before the players even get home from training.
            </p>
            <p className="text-[14px] text-[#555]" style={{ marginTop: '16px' }}>
              — Rugby Coach, Western Cape
            </p>
            <div className="mt-5 flex items-center justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-5 w-5" fill="#f59e0b" style={{ color: '#f59e0b' }} strokeWidth={0} />
              ))}
            </div>
            <p className="mt-4 text-[13px] text-[#444]">
              Trusted by coaches at schools across South Africa
            </p>
          </FadeIn>
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
                <p className="mt-2 text-[32px] font-extrabold text-white">Free</p>
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
