import { Heading, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Layout, Button } from './components'

interface PayoutSuccessEmailProps {
  artistName: string
  amount: number
  currency: string
  bands: string[]
  transferId: string
}

export const PayoutSuccessEmail = ({
  artistName = 'Artist',
  amount = 100,
  currency = 'CHF',
  bands = ['Your Band'],
  transferId = 'tr_xxx',
}: PayoutSuccessEmailProps) => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`

  return (
    <Layout preview={`Your payout of ${formattedAmount} has been processed!`}>
      <Heading style={heading}>Payout Successful!</Heading>

      <Text style={text}>
        Hi {artistName},
      </Text>

      <Text style={text}>
        Great news! We've just processed your payout.
      </Text>

      <div style={amountContainer}>
        <Text style={amountLabel}>Amount</Text>
        <Text style={amountValue}>{formattedAmount}</Text>
      </div>

      <Hr style={divider} />

      {bands.length > 0 && (
        <>
          <Text style={detailLabel}>Earnings from:</Text>
          <Text style={detailValue}>
            {bands.join(', ')}
          </Text>
        </>
      )}

      <Text style={detailLabel}>Transfer ID:</Text>
      <Text style={detailValue}>{transferId}</Text>

      <Hr style={divider} />

      <Text style={text}>
        The funds should arrive in your connected bank account within 2-7 business days, depending on your bank.
      </Text>

      <Button href="https://indiestream.art/dashboard">
        View Dashboard
      </Button>

      <Text style={smallText}>
        Questions about your payout? Visit our <a href="https://indiestream.art/help" style={link}>Help Center</a> or reply to this email.
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

const amountContainer = {
  backgroundColor: '#09090b',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const amountLabel = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const amountValue = {
  fontSize: '36px',
  fontWeight: '700',
  color: '#22c55e',
  margin: '0',
}

const detailLabel = {
  fontSize: '13px',
  color: '#71717a',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const detailValue = {
  fontSize: '14px',
  color: '#a1a1aa',
  margin: '0 0 16px',
  fontFamily: 'monospace',
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

export default PayoutSuccessEmail
