'use client'

import { useRouter } from 'next/navigation'

export default function PaymentCancel() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="text-center">
        <div className="mb-4 text-5xl">😕</div>
        <h1 className="mb-2 text-xl font-bold text-white">
          Payment Cancelled
        </h1>
        <p className="mb-6 text-gray-400">
          No worries — you can upgrade anytime from your account.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-500"
        >
          Back to PlayForge
        </button>
      </div>
    </div>
  )
}
