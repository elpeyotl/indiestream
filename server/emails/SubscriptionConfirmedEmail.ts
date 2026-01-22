import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface SubscriptionConfirmedEmailProps {
  userName: string
  tier: string
  amount: number
  currency: string
  periodEnd: string
}

export const getSubscriptionConfirmedEmailTemplate = ({
  userName = 'Listener',
  tier = 'Listener',
  amount = 9.99,
  currency = 'CHF',
  periodEnd = '2024-02-14',
}: SubscriptionConfirmedEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`
  const appUrl = getAppUrl()

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Subscription Confirmed
    </mj-text>

    <mj-text>
      Hi ${userName},
    </mj-text>

    <mj-text>
      Your Fairtune subscription is now active. You have unlimited access to stream all the music on our platform.
    </mj-text>

    <mj-text padding="20px 24px" background-color="#09090b" border-radius="12px">
      <span style="color: #71717a; font-size: 14px;">Plan</span><br/>
      <span style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${tier}</span><br/><br/>
      <span style="color: #71717a; font-size: 14px;">Amount</span><br/>
      <span style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${formattedAmount}/month</span><br/><br/>
      <span style="color: #71717a; font-size: 14px;">Next billing date</span><br/>
      <span style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${periodEnd}</span>
    </mj-text>

    <mj-divider />

    <mj-text font-size="16px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      Your subscription includes:
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="16px">
      Unlimited streaming of all tracks
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="16px">
      High-quality audio playback
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="16px">
      Direct artist support with every stream
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px" padding-left="16px">
      Create unlimited playlists
    </mj-text>

    ${primaryButton('Start Listening', `${appUrl}/discover`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Manage your subscription anytime from your <a href="${appUrl}/settings">account settings</a>.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Your ${tier} subscription is now active!`)
}

export default getSubscriptionConfirmedEmailTemplate
