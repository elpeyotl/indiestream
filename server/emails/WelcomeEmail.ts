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
      Welcome to Fairstream!
    </mj-text>

    <mj-text>
      Hi ${userName},
    </mj-text>

    <mj-text>
      Thanks for joining Fairstream! You're now part of a community that supports independent artists directly.
    </mj-text>

    <mj-text padding="20px 24px" background-color="#1e1b4b" border-radius="12px" border-left="4px solid #8b5cf6" color="#c4b5fd">
      When you stream on Fairstream, <span class="highlight"><strong>70% goes directly to artists</strong></span> - that's 2x more than other platforms.
    </mj-text>

    <mj-divider />

    <mj-text font-size="18px" font-weight="600" color="#f4f4f5" padding-bottom="16px">
      What makes Fairstream different?
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px">
      <strong class="highlight">Fair Pay:</strong> 70% of your subscription goes to artists
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px">
      <strong class="highlight">Direct Support:</strong> Your streams directly fund the artists you love
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px">
      <strong class="highlight">Independent Music:</strong> Discover artists you won't find on mainstream platforms
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px">
      <strong class="highlight">No Middlemen:</strong> Artists upload directly and keep their rights
    </mj-text>

    ${primaryButton('Start Discovering Music', `${appUrl}/discover`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Questions? Reply to this email or visit our <a href="${appUrl}/help">Help Center</a>.
    </mj-text>
  `

  return wrapInBaseTemplate(content, 'Welcome to Fairstream! Start discovering independent music.')
}

export default getWelcomeEmailTemplate
