import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface SubscriptionConfirmedEmailProps {
  userName: string
  tier: string
  amount: number
  currency: string
  periodEnd: string
}

export const SubscriptionConfirmedEmail = ({
  userName = 'Listener',
  tier = 'Listener',
  amount = 9.99,
  currency = 'CHF',
  periodEnd = '2024-02-14',
}: SubscriptionConfirmedEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`

  return (
    <Layout preview={`Your ${tier} subscription is now active!`}>
      <Heading style={heading}>Subscription Confirmed</Heading>

      <Text style={text}>
        Hi {userName},
      </Text>

      <Text style={text}>
        Your Indiestream subscription is now active. You have unlimited access to stream all the music on our platform.
      </Text>

      <div style={detailsContainer}>
        <div style={detailRow}>
          <Text style={detailLabel}>Plan</Text>
          <Text style={detailValue}>{tier}</Text>
        </div>
        <div style={detailRow}>
          <Text style={detailLabel}>Amount</Text>
          <Text style={detailValue}>{formattedAmount}/month</Text>
        </div>
        <div style={detailRow}>
          <Text style={detailLabel}>Next billing date</Text>
          <Text style={detailValue}>{periodEnd}</Text>
        </div>
      </div>

      <Hr style={divider} />

      <Text style={subheading}>Your subscription includes:</Text>

      <Text style={listItem}>
        Unlimited streaming of all tracks
      </Text>
      <Text style={listItem}>
        High-quality audio playback
      </Text>
      <Text style={listItem}>
        Direct artist support with every stream
      </Text>
      <Text style={listItem}>
        Create unlimited playlists
      </Text>

      <Button href="https://indiestream.art/discover">
        Start Listening
      </Button>

      <Text style={smallText}>
        Manage your subscription anytime from your <a href="https://indiestream.art/settings" style={link}>account settings</a>.
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

const detailsContainer = {
  backgroundColor: '#09090b',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
}

const detailLabel = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
}

const detailValue = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#f4f4f5',
  margin: '0',
}

const subheading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#f4f4f5',
  margin: '24px 0 12px',
}

const listItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#a1a1aa',
  margin: '0 0 8px',
  paddingLeft: '16px',
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

export default SubscriptionConfirmedEmail
