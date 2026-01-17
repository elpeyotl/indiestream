import { Button as ReactEmailButton } from '@react-email/components'
import * as React from 'react'

interface ButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export const Button = ({ href, children, variant = 'primary' }: ButtonProps) => {
  const style = variant === 'primary' ? primaryButton : secondaryButton

  return (
    <ReactEmailButton href={href} style={style}>
      {children}
    </ReactEmailButton>
  )
}

const primaryButton = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '16px 0',
}

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  color: '#a1a1aa',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  margin: '16px 0',
}

export default Button
