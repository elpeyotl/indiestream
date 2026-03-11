import { wrapInBaseTemplate, primaryButton, getAppUrl } from './base'

export interface UploadApprovedEmailProps {
  displayName: string
  email: string
  uploadId: string
  uploadType: 'Music Upload' | 'Batch Upload'
  albumTitle: string
  submissionDate: string
  approvalDate: string
  adminName: string
  numberOfTracks: number
  trackList: string[]
  termsVersion: string
  ipAddress: string | null
  dashboardUrl: string
}

export const getUploadApprovedEmailTemplate = ({
  displayName,
  email,
  uploadId,
  uploadType,
  albumTitle,
  submissionDate,
  approvalDate,
  adminName,
  numberOfTracks,
  trackList,
  termsVersion,
  ipAddress,
  dashboardUrl,
}: UploadApprovedEmailProps) => {
  const appUrl = getAppUrl()
  const dashboard = dashboardUrl || `${appUrl}/dashboard`

  const trackListFormatted = trackList
    .map((t, i) => `${i + 1}. ${t}`)
    .join('<br/>')

  const content = `
    <mj-text align="center" font-size="28px" font-weight="700" color="#f4f4f5" padding-bottom="24px">
      Your music is live!
    </mj-text>

    <mj-text>
      Hi ${displayName},
    </mj-text>

    <mj-text>
      Great news — your upload has been reviewed and approved by our team! Your music is now live on Fairtune and available to listeners.
    </mj-text>

    <mj-divider />

    <mj-text font-size="18px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      Release Details
    </mj-text>

    <mj-table>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Upload ID</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px; font-family: monospace;">${uploadId}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Album</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px; font-weight: 600;">${albumTitle}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Upload Type</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px;">${uploadType}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Submitted on</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px;">${submissionDate}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Approved on</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px;">${approvalDate}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Approved by</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px;">${adminName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Number of Tracks</td>
        <td style="padding: 6px 12px; color: #f4f4f5; font-size: 14px;">${numberOfTracks}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; color: #71717a; font-size: 14px;">Status</td>
        <td style="padding: 6px 12px; color: #2dd4bf; font-size: 14px; font-weight: 600;">Approved &amp; Live</td>
      </tr>
    </mj-table>

    <mj-text font-size="13px" color="#a1a1aa" padding-top="8px">
      <strong style="color: #f4f4f5;">Track List:</strong><br/>
      ${trackListFormatted}
    </mj-text>

    <mj-divider />

    <mj-text font-size="18px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      What happens now?
    </mj-text>

    <mj-text>
      Your tracks are live and can be streamed by listeners immediately. You can monitor your streams, listening stats, and earnings at any time in your dashboard. Payouts are processed monthly once your balance reaches CHF 10.00.
    </mj-text>

    ${primaryButton('Go to Dashboard', dashboard)}

    <mj-divider />

    <mj-text font-size="18px" font-weight="600" color="#f4f4f5" padding-bottom="12px">
      Contract Confirmation
    </mj-text>

    <mj-text font-size="13px">
      By submitting your upload on ${submissionDate} you accepted the Terms and Conditions of Fairtune. With the approval of your content on ${approvalDate}, the following contract is now in effect.
    </mj-text>

    <mj-divider />

    <mj-text font-size="16px" font-weight="600" color="#f4f4f5" padding-bottom="8px">
      Agreement between Rights Holder and Fairtune
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">Parties</strong><br/>
      Rights Holder: ${displayName}, ${email}<br/>
      Platform: Fairtune
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">Upload submitted:</strong> ${submissionDate}<br/>
      <strong style="color: #f4f4f5;">Contract effective as of:</strong> ${approvalDate}
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 1 &ndash; Subject Matter</strong><br/>
      This agreement governs the terms under which the Rights Holder publishes musical content on the Fairtune platform and receives compensation for it. The agreement takes effect upon approval of the uploaded content by a Fairtune administrator.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 2 &ndash; Rights Confirmation</strong><br/>
      The Rights Holder confirms that they hold all necessary rights to the uploaded content or possess the required licenses. They guarantee that the content does not infringe upon any third-party rights and is free from unlawful or objectionable material. The Rights Holder shall indemnify Fairtune against all third-party claims.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 3 &ndash; Review and Publication</strong><br/>
      Every upload is reviewed by Fairtune prior to publication. Fairtune reserves the right to reject, remove, or block content at any time without providing reasons, even after initial approval.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 4 &ndash; License Grant</strong><br/>
      The Rights Holder grants Fairtune a non-exclusive, worldwide, revocable license to host, stream, and promote the content on the Platform. The Rights Holder may revoke this license at any time via their dashboard.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 5 &ndash; Compensation Model</strong><br/>
      Compensation is based on the User-Centric Payment System (UCPS). Each listener's subscription fee is distributed directly and proportionally to the artists that listener actually streamed. Listening time is tracked to the second.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">How a listener's subscription fee is distributed (example: CHF 9.99):</strong><br/>
      &bull; 70% (CHF 6.99) &ndash; distributed to artists based on listening time<br/>
      &bull; 15% (CHF 1.50) &ndash; royalties to collecting societies (PROs)<br/>
      &bull; 15% (CHF 1.50) &ndash; platform costs (servers, bandwidth, team)
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 6 &ndash; Payouts</strong><br/>
      &bull; Payouts are processed monthly.<br/>
      &bull; Minimum payout threshold: CHF 10.00. Balances below this amount carry over to the next month.<br/>
      &bull; Detailed reports are available at any time in your dashboard.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 7 &ndash; Term and Termination</strong><br/>
      This agreement is concluded for an indefinite period. The Rights Holder may terminate their account and this agreement at any time via their dashboard. Outstanding balances above CHF 10.00 will be paid out within 60 days. Balances below CHF 10.00 are forfeited upon termination.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 8 &ndash; Amendments</strong><br/>
      Fairtune reserves the right to amend the contract terms at any time. Changes will be communicated by email. Continued use constitutes acceptance.
    </mj-text>

    <mj-text font-size="13px">
      <strong style="color: #f4f4f5;">&sect; 9 &ndash; Governing Law</strong><br/>
      This agreement is governed by Swiss law. The place of jurisdiction is the registered office of Fairtune in Switzerland.
    </mj-text>

    <mj-divider />

    <mj-text font-size="12px" color="#71717a">
      The full Terms and Conditions of Fairtune, as in effect at the time of upload submission, apply.<br/><br/>
      <strong>Terms Version:</strong> ${termsVersion}<br/>
      <strong>Terms accepted on:</strong> ${submissionDate}<br/>
      <strong>Contract effective as of:</strong> ${approvalDate}<br/>
      ${ipAddress ? `<strong>IP Address (at submission):</strong> ${ipAddress}<br/>` : ''}
    </mj-text>

    <mj-text font-size="12px" color="#52525b" padding-top="16px">
      This email was generated automatically. You are receiving it as confirmation that your upload has been approved and your contract with Fairtune is now in effect. Please keep this email for your records.
    </mj-text>
  `

  return wrapInBaseTemplate(content, `Your music "${albumTitle}" is now live on Fairtune!`)
}

export default getUploadApprovedEmailTemplate
