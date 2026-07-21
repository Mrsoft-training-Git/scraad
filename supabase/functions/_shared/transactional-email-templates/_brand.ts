// Shared inline styles for ScraAD-branded transactional emails.
export const brand = {
  navy: '#0B3C5D',
  gold: '#E8963A',
  ink: '#1a1a1a',
  muted: '#55575d',
  border: '#e5e7eb',
  soft: '#f6f8fb',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Arial, sans-serif",
  margin: 0,
  padding: 0,
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 24px',
}

export const header = {
  padding: '28px 0 20px',
  borderBottom: `3px solid ${brand.gold}`,
  marginBottom: '28px',
}

export const brandName = {
  fontSize: '22px',
  fontWeight: 700 as const,
  color: brand.navy,
  letterSpacing: '0.5px',
  margin: 0,
}

export const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: brand.navy,
  margin: '0 0 16px',
  lineHeight: '1.3',
}

export const text = {
  fontSize: '15px',
  color: brand.ink,
  lineHeight: '1.6',
  margin: '0 0 16px',
}

export const muted = {
  fontSize: '13px',
  color: brand.muted,
  lineHeight: '1.5',
  margin: '0 0 12px',
}

export const button = {
  backgroundColor: brand.navy,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const card = {
  backgroundColor: brand.soft,
  border: `1px solid ${brand.border}`,
  borderRadius: '10px',
  padding: '20px',
  margin: '20px 0',
}

export const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: '1.5',
  margin: '32px 0 24px',
  paddingTop: '20px',
  borderTop: `1px solid ${brand.border}`,
  textAlign: 'center' as const,
}
