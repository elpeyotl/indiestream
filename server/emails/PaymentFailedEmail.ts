import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface PaymentFailedEmailProps {
  userName: string
  amount: number
  currency: string
  updatePaymentUrl: string
}

export const getPaymentFailedEmailTemplate = ({
  userName = 'Listener',
  amount = 9.99,
  currency = 'CHF',
  updatePaymentUrl,
}: PaymentFailedEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`
  const appUrl = getAppUrl()
  const paymentUrl = updatePaymentUrl || `${appUrl}/settings/billing`

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Payment Failed
    </mj-text>

    <mj-text>
      Hi ${userName},
    </mj-text>

    <mj-text>
      We couldn't process your payment of <span class="highlight"><strong>${formattedAmount}</strong></span> for your Indiestream subscription.
    </mj-text>

    <mj-text padding="16px 20px" background-color="#292524" border-radius="8px" border-left="4px solid #f59e0b" color="#fbbf24" font-size="14px" line-height="22px">
      Your subscription access may be interrupted if payment isn't resolved soon.
    </mj-text>

    <mj-divider />

    <mj-text font-size="16px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      Common reasons for payment failure:
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Card has expired or been replaced
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Insufficient funds
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Card issuer declined the charge
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px" padding-left="8px">
      • Bank requires additional verification
    </mj-text>

    <mj-text>
      Please update your payment method to continue enjoying unlimited music and supporting independent artists.
    </mj-text>

    ${primaryButton('Update Payment Method', paymentUrl)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Need help? Reply to this email or contact us at <a href="mailto:hello.indiestream@gmail.com">hello.indiestream@gmail.com</a>
    </mj-text>
  `

  return wrapInBaseTemplate(content, 'Payment failed - Update your payment method to continue listening')
}

export default getPaymentFailedEmailTemplate
