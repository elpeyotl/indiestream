import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface WelcomeEmailProps {
  userName: string
  subscriptionTier: string
}

export const getWelcomeEmailTemplate = ({
  userName = 'Listener',
  subscriptionTier = 'listener',
}: WelcomeEmailProps) => {
  const appUrl = getAppUrl()

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Welcome to Fairtune
    </mj-text>

    <mj-text>
      Hi ${userName},
    </mj-text>

    <mj-text>
      You're in. Here's how your money works on Fairtune.
    </mj-text>

    <mj-text padding="20px 24px" background-color="#1e1b4b" border-radius="12px" border-left="4px solid #8b5cf6" color="#c4b5fd">
      <strong class="highlight">70% to artists.</strong> Split between whoever you actually listen to. No pool. No mystery.
    </mj-text>

    <mj-divider />

    <mj-text font-size="18px" font-weight="600" color="#f4f4f5" padding-bottom="16px">
      Where your $9.99 goes
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px">
      <strong class="highlight">$6.99 (70%)</strong> to the artists you listen to
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px">
      <strong class="highlight">$1.50 (15%)</strong> to royalties (PROs like ASCAP, BMI, GEMA)
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px">
      <strong class="highlight">$1.50 (15%)</strong> keeps us running (servers, bandwidth, team)
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px">
      Every month, you'll see exactly where your money went. Cent by cent.
    </mj-text>

    ${primaryButton('Start listening', `${appUrl}/discover`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Questions? Reply to this email or visit our <a href="${appUrl}/help">Help Center</a>.
    </mj-text>
  `

  return wrapInBaseTemplate(content, 'Welcome to Fairtune! Start discovering independent music.')
}

export default getWelcomeEmailTemplate
