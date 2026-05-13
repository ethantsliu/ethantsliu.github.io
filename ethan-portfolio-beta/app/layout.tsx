import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://xn--rss.to'),
  title: 'Ethan Liu — Portfolio',
  description: 'AI/ML • Systems • Evaluation — portfolio of projects and research.',
  openGraph: { title: 'Ethan Liu — Portfolio', description: 'AI/ML • Systems • Evaluation — portfolio of projects and research.', type: 'website', url: 'https://xn--rss.to', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body>{children}</body>
    </html>
  )
}
