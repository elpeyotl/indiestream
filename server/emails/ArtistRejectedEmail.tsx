import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface ArtistRejectedEmailProps {
  artistName: string
  bandName: string
  reason?: string
}

export const ArtistRejectedEmail = ({
  artistName = 'Artist',
  bandName = 'Your Band',
  reason,
}: ArtistRejectedEmailProps) => {
  return (
    <Layout preview={`Update on your ${bandName} artist application`}>
      <Heading style={heading}>Application Update</Heading>

      <Text style={text}>
        Hi {artistName},
      </Text>

      <Text style={text}>
        Thank you for your interest in joining Indiestream. After reviewing your application for <strong style={highlight}>{bandName}</strong>, we're unable to approve it at this time.
      </Text>

      {reason && (
        <>
          <Hr style={divider} />
          <Text style={reasonLabel}>Reason:</Text>
          <Text style={reasonText}>{reason}</Text>
          <Hr style={divider} />
        </>
      )}

      <Text style={text}>
        Don't worry - you're welcome to reapply after addressing any feedback. Make sure your application includes:
      </Text>

      <Text style={listItem}>
        • Original music that you own the rights to
      </Text>
      <Text style={listItem}>
        • A complete artist profile with bio and images
      </Text>
      <Text style={listItem}>
        • High-quality audio files
      </Text>

      <Button href="https://indiestream.art/register/artist" variant="secondary">
        Reapply as Artist
      </Button>

      <Text style={smallText}>
        If you believe this was a mistake or have questions, please reply to this email and we'll be happy to help.
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
  color: '#f4f4f5',
}

const reasonLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#f4f4f5',
  margin: '0 0 8px',
}

const reasonText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#fbbf24',
  margin: '0',
  padding: '12px 16px',
  backgroundColor: '#292524',
  borderRadius: '8px',
  borderLeft: '3px solid #fbbf24',
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

export default ArtistRejectedEmail
