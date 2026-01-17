import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface PayoutFailedEmailProps {
  artistName: string
  amount: number
  currency: string
  errorMessage: string
}

export const PayoutFailedEmail = ({
  artistName = 'Artist',
  amount = 100,
  currency = 'CHF',
  errorMessage = 'An error occurred',
}: PayoutFailedEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`

  return (
    <Layout preview={`Payout of ${formattedAmount} failed - action may be required`}>
      <Heading style={heading}>Payout Failed</Heading>

      <Text style={text}>
        Hi {artistName},
      </Text>

      <Text style={text}>
        We attempted to process your payout of <strong style={highlight}>{formattedAmount}</strong>, but unfortunately it didn't go through.
      </Text>

      <div style={errorContainer}>
        <Text style={errorLabel}>Error Details:</Text>
        <Text style={errorText}>{errorMessage}</Text>
      </div>

      <Hr style={divider} />

      <Text style={subheading}>Common causes:</Text>

      <Text style={listItem}>
        • Your Stripe Connect account may need verification
      </Text>
      <Text style={listItem}>
        • Bank account details may be incorrect or outdated
      </Text>
      <Text style={listItem}>
        • Your account balance may have changed
      </Text>

      <Text style={text}>
        Don't worry - your earnings are still safe in your account. We'll retry the payout automatically, or you can check your Stripe settings.
      </Text>

      <Button href="https://indiestream.art/dashboard">
        Check Dashboard
      </Button>

      <Text style={smallText}>
        Need help? Reply to this email or contact us at <a href="mailto:support@indiestream.art" style={link}>support@indiestream.art</a>
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

const subheading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#f4f4f5',
  margin: '24px 0 12px',
}

const errorContainer = {
  backgroundColor: '#292524',
  borderRadius: '8px',
  padding: '16px',
  borderLeft: '3px solid #ef4444',
  margin: '24px 0',
}

const errorLabel = {
  fontSize: '12px',
  color: '#ef4444',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const errorText = {
  fontSize: '14px',
  color: '#fca5a5',
  margin: '0',
  fontFamily: 'monospace',
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

export default PayoutFailedEmail
