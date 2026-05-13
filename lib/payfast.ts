import crypto from 'crypto'

const MERCHANT_ID = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID!
const MERCHANT_KEY = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY!
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? ''
const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true'

export const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process'

export interface PayFastData {
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  name_first: string
  email_address: string
  m_payment_id: string
  amount: string
  item_name: string
  subscription_type: string
  billing_date: string
  recurring_amount: string
  frequency: string
  cycles: string
}

export type PayFastSubmitData = PayFastData & { signature: string }

export function generatePayFastForm(
  userEmail: string,
  userName: string,
  userId: string
): { url: string; data: PayFastSubmitData } {
  const baseUrl = IS_SANDBOX
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'

  const today = new Date().toISOString().split('T')[0] ?? ''

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''

  const data: PayFastData = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${siteUrl}/payment/success`,
    cancel_url: `${siteUrl}/payment/cancel`,
    notify_url: `${siteUrl}/api/payfast/webhook`,
    name_first: userName.split(' ')[0] || 'Coach',
    email_address: userEmail,
    m_payment_id: userId,
    amount: '199.00',
    item_name: 'PlayForge Pro Monthly',
    subscription_type: '1',
    billing_date: today,
    recurring_amount: '199.00',
    frequency: '3',
    cycles: '0',
  }

  const paramString = Object.keys(data)
    .sort()
    .map((key) => {
      const val = data[key as keyof PayFastData]
      return `${key}=${encodeURIComponent(String(val).trim())}`
    })
    .join('&')

  const signatureString = PASSPHRASE.trim()
    ? `${paramString}&passphrase=${encodeURIComponent(PASSPHRASE.trim())}`
    : paramString

  const signature = crypto
    .createHash('md5')
    .update(signatureString)
    .digest('hex')

  return {
    url: baseUrl,
    data: { ...data, signature },
  }
}
