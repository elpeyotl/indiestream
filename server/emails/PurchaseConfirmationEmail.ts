import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface PurchaseConfirmationEmailProps {
  userName: string
  albumTitle: string
  artistName: string
  amount: number
  currency: string
  downloadUrl: string
}

export const getPurchaseConfirmationEmailTemplate = ({
  userName = 'Music Lover',
  albumTitle = 'Album',
  artistName = 'Artist',
  amount = 9.99,
  currency = 'CHF',
  downloadUrl = '',
}: PurchaseConfirmationEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`
  const appUrl = getAppUrl()

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Thanks for your purchase!
    </mj-text>

    <mj-text>
      Hi ${userName},
    </mj-text>

    <mj-text>
      You now own <strong>${albumTitle}</strong> by <strong>${artistName}</strong>. Download it anytime in high-quality FLAC or AAC format.
    </mj-text>

    <mj-text padding="20px 24px" background-color="#09090b" border-radius="12px">
      <span style="color: #71717a; font-size: 14px;">Album</span><br/>
      <span style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${albumTitle}</span><br/><br/>
      <span style="color: #71717a; font-size: 14px;">Artist</span><br/>
      <span style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${artistName}</span><br/><br/>
      <span style="color: #71717a; font-size: 14px;">Amount paid</span><br/>
      <span style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${formattedAmount}</span>
    </mj-text>

    <mj-divider />

    <mj-text font-size="16px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      Your support matters
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="24px">
      85% of your purchase goes directly to ${artistName}. Thank you for supporting independent music!
    </mj-text>

    ${primaryButton('Download your music', downloadUrl || `${appUrl}/library/purchases`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      View all your purchases in your <a href="${appUrl}/library/purchases">music library</a>.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Your purchase of ${albumTitle}`)
}

export default getPurchaseConfirmationEmailTemplate
