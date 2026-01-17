// Base MJML template wrapper with Indiestream branding
// Colors: dark theme (#09090b background), violet accent (#8b5cf6)

// Get app URL from runtime config or use default
const getAppUrl = () => {
  try {
    const config = useRuntimeConfig()
    return config.public.appUrl || 'https://indiestream.vercel.app'
  } catch {
    return 'https://indiestream.vercel.app'
  }
}

export const wrapInBaseTemplate = (content: string, previewText: string = '') => {
  const appUrl = getAppUrl()
  return `
<mjml>
  <mj-head>
    <mj-title>Indiestream</mj-title>
    <mj-preview>${previewText}</mj-preview>
    <mj-attributes>
      <mj-all font-family="system-ui, -apple-system, sans-serif" />
      <mj-text color="#a1a1aa" font-size="16px" line-height="24px" />
      <mj-button background-color="#8b5cf6" color="#ffffff" border-radius="8px" font-size="16px" font-weight="600" padding="12px 24px" />
      <mj-divider border-color="#27272a" border-width="1px" />
    </mj-attributes>
    <mj-style>
      a { color: #8b5cf6; text-decoration: underline; }
      .highlight { color: #f4f4f5; }
      .highlight-violet { color: #8b5cf6; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#09090b">
    <!-- Header -->
    <mj-section padding="32px 24px 16px">
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="700" color="#f4f4f5">
          Indiestream
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Content -->
    <mj-section background-color="#18181b" border-radius="12px" padding="32px 24px">
      <mj-column>
        ${content}
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section padding="24px">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#52525b">
          &copy; ${new Date().getFullYear()} Indiestream. Supporting independent artists.
        </mj-text>
        <mj-text align="center" font-size="12px" color="#52525b" padding-top="8px">
          <a href="${appUrl}/help" style="color: #71717a;">Help</a> &nbsp;|&nbsp;
          <a href="${appUrl}/privacy" style="color: #71717a;">Privacy</a> &nbsp;|&nbsp;
          <a href="${appUrl}/terms" style="color: #71717a;">Terms</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`
}

// Helper for primary button
export const primaryButton = (text: string, href: string) => `
  <mj-button href="${href}">
    ${text}
  </mj-button>
`

// Helper for secondary button
export const secondaryButton = (text: string, href: string) => `
  <mj-button href="${href}" background-color="transparent" border="1px solid #3f3f46" color="#a1a1aa" font-size="14px" font-weight="500" padding="10px 20px">
    ${text}
  </mj-button>
`

// Export app URL getter for use in templates
export { getAppUrl }
