import { wrapInBaseTemplate, secondaryButton, getAppUrl } from './base'

interface TrackRemovedEmailProps {
  artistName: string
  trackTitle: string
  albumTitle: string
  bandName: string
  reason: 'copyright' | 'ai_generated' | 'inappropriate' | 'other'
  details?: string
}

const getReasonText = (reason: string): string => {
  switch (reason) {
    case 'copyright':
      return 'Copyright Violation - The track was reported as infringing on copyrighted material.'
    case 'ai_generated':
      return 'AI-Generated Content - The track was determined to be AI-generated, which is not permitted on Fairstream.'
    case 'inappropriate':
      return 'Inappropriate Content - The track contained content that violates our community guidelines.'
    default:
      return 'Policy Violation - The track violated our terms of service.'
  }
}

export const getTrackRemovedEmailTemplate = ({
  artistName = 'Artist',
  trackTitle,
  albumTitle,
  bandName,
  reason,
  details,
}: TrackRemovedEmailProps) => {
  const appUrl = getAppUrl()

  const detailsSection = details ? `
    <mj-divider />
    <mj-text font-size="14px" font-weight="600" color="#f4f4f5" padding-bottom="8px">
      Additional Details:
    </mj-text>
    <mj-text padding="12px 16px" background-color="#292524" border-radius="8px" border-left="3px solid #71717a" color="#a1a1aa" font-size="14px" line-height="22px">
      ${details}
    </mj-text>
    <mj-divider />
  ` : ''

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Track Removed
    </mj-text>

    <mj-text>
      Hi ${artistName},
    </mj-text>

    <mj-text>
      We're writing to inform you that your track <span class="highlight"><strong>"${trackTitle}"</strong></span> from the album <span class="highlight"><strong>${albumTitle}</strong></span> (${bandName}) has been removed from Fairstream.
    </mj-text>

    <mj-divider />

    <mj-text font-size="14px" font-weight="600" color="#f4f4f5" padding-bottom="8px">
      Reason for Removal:
    </mj-text>
    <mj-text padding="12px 16px" background-color="#292524" border-radius="8px" border-left="3px solid #ef4444" color="#fca5a5" font-size="14px" line-height="22px">
      ${getReasonText(reason)}
    </mj-text>

    ${detailsSection}

    <mj-text>
      If you believe this removal was made in error, you may appeal this decision by replying to this email with additional information or evidence supporting your case.
    </mj-text>

    <mj-text font-size="14px" color="#a1a1aa" padding-top="8px">
      Please note that repeated violations of our content policies may result in account suspension or termination.
    </mj-text>

    ${secondaryButton('View Content Policy', `${appUrl}/terms`)}

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      If you have questions about this removal or our content policies, please reply to this email and our team will assist you.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Track Removed: ${trackTitle}`)
}

export default getTrackRemovedEmailTemplate
