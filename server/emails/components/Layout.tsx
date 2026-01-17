import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export const Layout = ({ preview, children }: LayoutProps) => {
  return (
    <Html>
      <Head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          `}
        </style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Link href="https://indiestream.art" style={logoLink}>
              <Text style={logoText}>Indiestream</Text>
            </Link>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Stream Fair. Support Direct.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://indiestream.art" style={footerLink}>Visit Indiestream</Link>
              {' | '}
              <Link href="https://indiestream.art/help" style={footerLink}>Help Center</Link>
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} Indiestream. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles matching brand
const main = {
  backgroundColor: '#09090b',
  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const header = {
  padding: '24px 32px',
  textAlign: 'center' as const,
}

const logoLink = {
  textDecoration: 'none',
}

const logoText = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#8b5cf6',
  margin: '0',
  letterSpacing: '-0.5px',
}

const content = {
  backgroundColor: '#18181b',
  borderRadius: '12px',
  padding: '32px',
  margin: '0 16px',
}

const footer = {
  padding: '32px 16px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 8px',
}

const footerLinks = {
  fontSize: '12px',
  color: '#52525b',
  margin: '0 0 16px',
}

const footerLink = {
  color: '#a1a1aa',
  textDecoration: 'none',
}

const footerCopyright = {
  fontSize: '11px',
  color: '#3f3f46',
  margin: '0',
}

export default Layout
