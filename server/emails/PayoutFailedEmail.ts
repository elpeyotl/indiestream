import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface PayoutFailedEmailProps {
  artistName: string
  amount: number
  currency: string
  errorMessage: string
}

export const getPayoutFailedEmailTemplate = ({
  artistName = 'Artist',
  amount = 100,
  currency = 'CHF',
  errorMessage = 'An error occurred',
}: PayoutFailedEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`
  const appUrl = getAppUrl()

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Payout Failed
    </mj-text>

    <mj-text>
      Hi ${artistName},
    </mj-text>

    <mj-text>
      We attempted to process your payout of <span class="highlight"><strong>${formattedAmount}</strong></span>, but unfortunately it didn't go through.
    </mj-text>

    <mj-text padding="16px" background-color="#292524" border-radius="8px" border-left="3px solid #ef4444">
      <span style="color: #ef4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Error Details:</span><br/>
      <span style="color: #fca5a5; font-family: monospace; font-size: 14px;">${errorMessage}</span>
    </mj-text>

    <mj-divider />

    <mj-text font-size="16px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      Common causes:
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Your Stripe Connect account may need verification
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Bank account details may be incorrect or outdated
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px" padding-left="8px">
      • Your account balance may have changed
    </mj-text>

    <mj-text>
      Don't worry - your earnings are still safe in your account. We'll retry the payout automatically, or you can check your Stripe settings.
    </mj-text>

    ${primaryButton('Check Dashboard', `${appUrl}/dashboard`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Need help? Reply to this email or contact us at <a href="mailto:hello@fairtune.fm">hello@fairtune.fm</a>
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Payout of ${formattedAmount} failed - action may be required`)
}

export default getPayoutFailedEmailTemplate
