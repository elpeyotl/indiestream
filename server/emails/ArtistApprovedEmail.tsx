import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface ArtistApprovedEmailProps {
  artistName: string
  bandName: string
  dashboardUrl: string
}

export const ArtistApprovedEmail = ({
  artistName = 'Artist',
  bandName = 'Your Band',
  dashboardUrl = 'https://indiestream.art/dashboard',
}: ArtistApprovedEmailProps) => {
  return (
    <Layout preview={`${bandName} is now live on Indiestream!`}>
      <Heading style={heading}>Congratulations! 🎉</Heading>

      <Text style={text}>
        Hi {artistName},
      </Text>

      <Text style={text}>
        Great news! <strong style={highlight}>{bandName}</strong> has been approved and is now live on Indiestream.
      </Text>

      <Text style={text}>
        Your music is now available for streaming to listeners around the world. You can start uploading your tracks and managing your artist profile right away.
      </Text>

      <Hr style={divider} />

      <Text style={subheading}>What's next?</Text>

      <Text style={listItem}>
        • Upload your music and set up your discography
      </Text>
      <Text style={listItem}>
        • Complete your artist profile with a bio and images
      </Text>
      <Text style={listItem}>
        • Connect your Stripe account to receive payouts
      </Text>
      <Text style={listItem}>
        • Share your profile and start earning
      </Text>

      <Button href={dashboardUrl}>
        Go to Artist Dashboard
      </Button>

      <Text style={smallText}>
        Questions? Visit our <a href="https://indiestream.art/help" style={link}>Help Center</a> or reply to this email.
      </Text>
    </Layout>
  )
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#f4f4f5',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#a1a1aa',
  margin: '0 0 16px',
}

const highlight = {
  color: '#8b5cf6',
}

const subheading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#f4f4f5',
  margin: '24px 0 12px',
}

const listItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#a1a1aa',
  margin: '0 0 8px',
  paddingLeft: '8px',
}

const divider = {
  borderColor: '#27272a',
  margin: '24px 0',
}

const smallText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#71717a',
  margin: '24px 0 0',
}

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
}

export default ArtistApprovedEmail
