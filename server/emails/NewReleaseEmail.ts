import { wrapInBaseTemplate, primaryButton, secondaryButton, getAppUrl } from './base'

interface NewReleaseEmailProps {
  followerName: string
  bandName: string
  bandSlug: string
  albumTitle: string
  albumSlug: string
  releaseType: 'album' | 'ep' | 'single'
  description?: string | null
  coverUrl?: string | null
}

const getReleaseTypeLabel = (type: 'album' | 'ep' | 'single'): string => {
  switch (type) {
    case 'album': return 'new album'
    case 'ep': return 'new EP'
    case 'single': return 'new single'
    default: return 'new release'
  }
}

export const getNewReleaseEmailTemplate = ({
  followerName = 'Listener',
  bandName,
  bandSlug,
  albumTitle,
  albumSlug,
  releaseType,
  description,
  coverUrl,
}: NewReleaseEmailProps) => {
  const appUrl = getAppUrl()
  const albumUrl = `${appUrl}/artist/${bandSlug}/${albumSlug}`
  const artistUrl = `${appUrl}/artist/${bandSlug}`
  const releaseLabel = getReleaseTypeLabel(releaseType)

  // Cover image section (only if coverUrl is provided)
  const coverSection = coverUrl ? `
    <mj-image src="${coverUrl}" alt="${albumTitle} cover" width="200px" border-radius="8px" padding-bottom="24px" />
  ` : ''

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      New Music Alert
    </mj-text>

    <mj-text>
      Hi ${followerName},
    </mj-text>

    <mj-text>
      <span class="highlight-violet"><strong>${bandName}</strong></span> just released a ${releaseLabel}!
    </mj-text>

    ${coverSection}

    <mj-text align="center" font-size="22px" font-weight="600" color="#f4f4f5" padding-bottom="8px">
      ${albumTitle}
    </mj-text>

    <mj-text align="center" font-size="14px" color="#71717a" padding-bottom="16px">
      by ${bandName}
    </mj-text>

    ${description ? `
    <mj-text font-size="14px" color="#a1a1aa" padding-bottom="24px" font-style="italic">
      "${description}"
    </mj-text>
    ` : ''}

    <mj-divider padding="16px 0" />

    ${primaryButton('Listen Now', albumUrl)}

    <mj-text align="center" padding-top="16px">
      ${secondaryButton('View Artist Profile', artistUrl)}
    </mj-text>

    <mj-text font-size="13px" color="#71717a" padding-top="24px">
      You're receiving this because you follow ${bandName} on Fairtune. Your support helps independent artists thrive.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `${bandName} released "${albumTitle}" - Listen now on Fairtune`)
}

export default getNewReleaseEmailTemplate
