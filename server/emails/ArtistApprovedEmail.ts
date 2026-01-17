import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

interface ArtistApprovedEmailProps {
  artistName: string
  bandName: string
  dashboardUrl: string
}

export const getArtistApprovedEmailTemplate = ({
  artistName = 'Artist',
  bandName = 'Your Band',
  dashboardUrl,
}: ArtistApprovedEmailProps) => {
  const appUrl = getAppUrl()
  const dashboard = dashboardUrl || `${appUrl}/dashboard`

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Congratulations! 🎉
    </mj-text>

    <mj-text>
      Hi ${artistName},
    </mj-text>

    <mj-text>
      Great news! <span class="highlight-violet"><strong>${bandName}</strong></span> has been approved and is now live on Indiestream.
    </mj-text>

    <mj-text>
      Your music is now available for streaming to listeners around the world. You can start uploading your tracks and managing your artist profile right away.
    </mj-text>

    <mj-divider />

    <mj-text font-size="18px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      What's next?
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Upload your music and set up your discography
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Complete your artist profile with a bio and images
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Connect your Stripe account to receive payouts
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px" padding-left="8px">
      • Share your profile and start earning
    </mj-text>

    ${primaryButton('Go to Artist Dashboard', dashboard)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      Questions? Visit our <a href="${appUrl}/help">Help Center</a> or reply to this email.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `${bandName} is now live on Indiestream!`)
}

export default getArtistApprovedEmailTemplate
