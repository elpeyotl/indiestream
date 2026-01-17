import { wrapInBaseTemplate, secondaryButton, getAppUrl } from './base'

interface ArtistRejectedEmailProps {
  artistName: string
  bandName: string
  reason?: string
}

export const getArtistRejectedEmailTemplate = ({
  artistName = 'Artist',
  bandName = 'Your Band',
  reason,
}: ArtistRejectedEmailProps) => {
  const appUrl = getAppUrl()

  const reasonSection = reason ? `
    <mj-divider />
    <mj-text font-size="14px" font-weight="600" color="#f4f4f5" padding-bottom="8px">
      Reason:
    </mj-text>
    <mj-text padding="12px 16px" background-color="#292524" border-radius="8px" border-left="3px solid #fbbf24" color="#fbbf24" font-size="14px" line-height="22px">
      ${reason}
    </mj-text>
    <mj-divider />
  ` : ''

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Application Update
    </mj-text>

    <mj-text>
      Hi ${artistName},
    </mj-text>

    <mj-text>
      Thank you for your interest in joining Indiestream. After reviewing your application for <span class="highlight"><strong>${bandName}</strong></span>, we're unable to approve it at this time.
    </mj-text>

    ${reasonSection}

    <mj-text>
      Don't worry - you're welcome to reapply after addressing any feedback. Make sure your application includes:
    </mj-text>

    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • Original music that you own the rights to
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="8px" padding-left="8px">
      • A complete artist profile with bio and images
    </mj-text>
    <mj-text font-size="14px" line-height="22px" padding-bottom="24px" padding-left="8px">
      • High-quality audio files
    </mj-text>

    ${secondaryButton('Reapply as Artist', `${appUrl}/register/artist`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      If you believe this was a mistake or have questions, please reply to this email and we'll be happy to help.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Update on your ${bandName} artist application`)
}

export default getArtistRejectedEmailTemplate
