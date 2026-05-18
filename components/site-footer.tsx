'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SiteFooter() {
  const pathname = usePathname()

  if (pathname === '/' || pathname.startsWith('/play/')) {
    return null
  }

  return (
    <footer
      className="border-t border-[#2a2a2a] bg-[#161616] px-6 py-4"
      style={{ borderTopWidth: '0.5px' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-[12px] text-[#555] sm:flex-row">
        <p className="shrink-0">© 2026 PlayForge. All rights reserved.</p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/pricing" className="text-[#888] transition-colors hover:text-white">
            Pricing
          </Link>
          <span className="text-[#333]">|</span>
          <Link href="/terms" className="text-[#888] transition-colors hover:text-white">
            Terms &amp; Conditions
          </Link>
        </nav>
        <a
          href="mailto:gjlh.otto@gmail.com"
          className="shrink-0 text-[#888] transition-colors hover:text-white"
        >
          gjlh.otto@gmail.com
        </a>
      </div>
    </footer>
  )
}
