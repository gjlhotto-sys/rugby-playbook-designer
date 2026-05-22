import {
  lemonSqueezySetup,
  createCheckout,
} from '@lemonsqueezy/lemonsqueezy.js'

export function setupLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error('LemonSqueezy error:', error),
  })
}

export async function createCheckoutSession({
  variantId,
  userEmail,
  userId,
  plan,
}: {
  variantId: string
  userEmail: string
  userId: string
  plan: 'monthly' | 'yearly'
}) {
  setupLemonSqueezy()

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!

  const checkout = await createCheckout(storeId, variantId, {
    checkoutOptions: {
      embed: false,
      media: false,
      logo: true,
    },
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
        plan,
      },
    },
    productOptions: {
      enabledVariants: [parseInt(variantId)],
      redirectUrl: `${
        process.env.NEXT_PUBLIC_APP_URL ??
        'https://playforge.co.za'
      }/?upgraded=true`,
      receiptButtonText: 'Go to PlayForge',
      receiptThankYouNote:
        'Welcome to PlayForge Pro! Your subscription is now active.',
    },
  })

  return checkout
}
