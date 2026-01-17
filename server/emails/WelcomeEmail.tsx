import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface WelcomeEmailProps {
  userName: string
  subscriptionTier: string
}

export const WelcomeEmail = ({
  userName = 'Listener',
  subscriptionTier = 'listener',
}: WelcomeEmailProps) => {
  return (
    <Layout preview="Welcome to Indiestream! Start discovering independent music.">
      <Heading style={heading}>Welcome to Indiestream!</Heading>

      <Text style={text}>
        Hi {userName},
      </Text>

      <Text style={text}>
        Thanks for joining Indiestream! You're now part of a community that supports independent artists directly.
      </Text>

      <div style={highlightBox}>
        <Text style={highlightText}>
          When you stream on Indiestream, <strong style={highlightStrong}>70% goes directly to artists</strong> - that's 2x more than other platforms.
        </Text>
      </div>

      <Hr style={divider} />

      <Text style={subheading}>What makes Indiestream different?</Text>

      <Text style={listItem}>
        <strong>Fair Pay:</strong> 70% of your subscription goes to artists
      </Text>
      <Text style={listItem}>
        <strong>Direct Support:</strong> Your streams directly fund the artists you love
      </Text>
      <Text style={listItem}>
        <strong>Independent Music:</strong> Discover artists you won't find on mainstream platforms
      </Text>
      <Text style={listItem}>
        <strong>No Middlemen:</strong> Artists upload directly and keep their rights
      </Text>

      <Button href="https://indiestream.art/discover">
        Start Discovering Music
      </Button>

      <Text style={smallText}>
        Questions? Reply to this email or visit our <a href="https://indiestream.art/help" style={link}>Help Center</a>.
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

const highlightBox = {
  backgroundColor: '#1e1b4b',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #8b5cf6',
}

const highlightText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#c4b5fd',
  margin: '0',
}

const highlightStrong = {
  color: '#f4f4f5',
}

const subheading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#f4f4f5',
  margin: '24px 0 16px',
}

const listItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#a1a1aa',
  margin: '0 0 12px',
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

export default WelcomeEmail
