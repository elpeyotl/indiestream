import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface PaymentFailedEmailProps {
  userName: string
  amount: number
  currency: string
  updatePaymentUrl: string
}

export const PaymentFailedEmail = ({
  userName = 'Listener',
  amount = 9.99,
  currency = 'CHF',
  updatePaymentUrl = 'https://indiestream.art/settings/billing',
}: PaymentFailedEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`

  return (
    <Layout preview="Payment failed - Update your payment method to continue listening">
      <Heading style={heading}>Payment Failed</Heading>

      <Text style={text}>
        Hi {userName},
      </Text>

      <Text style={text}>
        We couldn't process your payment of <strong style={highlight}>{formattedAmount}</strong> for your Indiestream subscription.
      </Text>

      <div style={warningBox}>
        <Text style={warningText}>
          Your subscription access may be interrupted if payment isn't resolved soon.
        </Text>
      </div>

      <Hr style={divider} />

      <Text style={subheading}>Common reasons for payment failure:</Text>

      <Text style={listItem}>
        • Card has expired or been replaced
      </Text>
      <Text style={listItem}>
        • Insufficient funds
      </Text>
      <Text style={listItem}>
        • Card issuer declined the charge
      </Text>
      <Text style={listItem}>
        • Bank requires additional verification
      </Text>

      <Text style={text}>
        Please update your payment method to continue enjoying unlimited music and supporting independent artists.
      </Text>

      <Button href={updatePaymentUrl}>
        Update Payment Method
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

const warningBox = {
  backgroundColor: '#292524',
  borderRadius: '8px',
  padding: '16px 20px',
  borderLeft: '4px solid #f59e0b',
  margin: '24px 0',
}

const warningText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#fbbf24',
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

export default PaymentFailedEmail
