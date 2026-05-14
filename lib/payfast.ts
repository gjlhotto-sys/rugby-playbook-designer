const MERCHANT_ID = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID!
const MERCHANT_KEY = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY!
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? ''
const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true'

export const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process'

function pfParamString(data: Record<string, string>): string {
  return Object.entries(data)
    .filter(([key]) => key !== 'merchant_key' && key !== 'signature')
    .filter(([, val]) => val !== '' && val != null)
    .map(([key, val]) => `${key}=${val}`)
    .join('&')
}

function generateSignature(
  data: Record<string, string>,
  passphrase: string
): string {
  const crypto = require('crypto')
  let str = pfParamString(data)
  if (passphrase && passphrase !== '') {
    str += `&passphrase=${passphrase}`
  }
  console.log('String to hash:', str)
  return crypto.createHash('md5').update(str).digest('hex')
}

export function generatePayFastForm(
  userEmail: string,
  userName: string,
  userId: string
): { url: string; data: Record<string, string> } {
  const today = new Date().toISOString().split('T')[0]
  const firstName = (userName || 'Coach').split(' ')[0]

  // Parameters MUST be in this exact order for PayFast
  const data: Record<string, string> = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/webhook`,
    name_first: firstName,
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

  const signature = generateSignature(data, PASSPHRASE)

  console.log('=== PayFast Debug ===')
  console.log('Merchant ID:', MERCHANT_ID)
  console.log('Passphrase empty?', PASSPHRASE === '')
  console.log('Data being sent:', JSON.stringify(data, null, 2))
  console.log('Signature:', signature)
  console.log('Full string that was hashed shown above')

  return {
    url: PAYFAST_URL,
    data: { ...data, signature },
  }
}
