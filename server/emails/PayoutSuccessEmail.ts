import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface PayoutSuccessEmailProps {
  artistName: string
  amount: number
  currency: string
  bands: string[]
  transferId: string
}

export const getPayoutSuccessEmailTemplate = ({
  artistName = 'Artist',
  amount = 100,
  currency = 'CHF',
  bands = ['Your Band'],
  transferId = 'tr_xxx',
}: PayoutSuccessEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`
  const appUrl = getAppUrl()

  const bandsSection = bands.length > 0 ? `
    <mj-text font-size="13px" color="#71717a" padding-bottom="4px" text-transform="uppercase" letter-spacing="0.5px">
      Earnings from:
    </mj-text>
    <mj-text font-size="14px" color="#a1a1aa" padding-bottom="16px" font-family="monospace">
      ${bands.join(', ')}
    </mj-text>
  ` : ''

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Payout Successful!
    </mj-text>

    <mj-text>
      Hi ${artistName},
    </mj-text>

    <mj-text>
      Great news! We've just processed your payout.
    </mj-text>

    <mj-text align="center" padding="0">
      <div style="padding: 24px; background-color: #09090b; border-radius: 12px; text-align: center;">
        <span style="color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Amount</span><br/>
        <span style="color: #22c55e; font-size: 36px; font-weight: 700;">${formattedAmount}</span>
      </div>
    </mj-text>

    <mj-divider />

    ${bandsSection}

    <mj-text font-size="13px" color="#71717a" padding-bottom="4px" text-transform="uppercase" letter-spacing="0.5px">
      Transfer ID:
    </mj-text>
    <mj-text font-size="14px" color="#a1a1aa" padding-bottom="16px" font-family="monospace">
      ${transferId}
    </mj-text>

    <mj-divider />

    <mj-text>
      The funds should arrive in your connected bank account within 2-7 business days, depending on your bank.
    </mj-text>

    ${primaryButton('View Dashboard', `${appUrl}/dashboard`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Questions about your payout? Visit our <a href="${appUrl}/help">Help Center</a> or reply to this email.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Your payout of ${formattedAmount} has been processed!`)
}

export default getPayoutSuccessEmailTemplate
