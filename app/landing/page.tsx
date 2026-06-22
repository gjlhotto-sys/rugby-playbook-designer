import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing-page'

const TITLE = 'PlayForge — Rugby & Netball Play Designer for Coaches'
const DESCRIPTION =
  'Design, animate and share rugby and netball plays with your team. Live match stats, WhatsApp sharing, works on any device. Free to start.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: ['/icon.svg'],
  },
}

export default function Landing() {
  return <LandingPage />
}
