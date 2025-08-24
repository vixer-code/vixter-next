import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './index.css'
import { Providers } from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vixter - Plataforma de Companhias Virtuais',
  description: 'Conecte-se com gamers e companhias virtuais. Duo gaming, coaching e chat de voz.',
  icons: {
    icon: [
      {
        url: '/images/iconFlorBranca.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/iconFlorPreta.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/images/iconFlorBranca.svg',
        type: 'image/svg+xml',
        sizes: '32x32',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/iconFlorPreta.svg',
        type: 'image/svg+xml',
        sizes: '32x32',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/images/iconFlorBranca.svg',
        type: 'image/svg+xml',
        sizes: '16x16',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/iconFlorPreta.svg',
        type: 'image/svg+xml',
        sizes: '16x16',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    shortcut: [
      {
        url: '/images/iconFlorBranca.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/iconFlorPreta.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [
      {
        url: '/images/iconFlorBranca.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/iconFlorPreta.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/svg+xml" href="/images/iconFlorBranca.svg" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/svg+xml" href="/images/iconFlorPreta.svg" media="(prefers-color-scheme: dark)" />
        <link rel="shortcut icon" href="/images/iconFlorBranca.svg" media="(prefers-color-scheme: light)" />
        <link rel="shortcut icon" href="/images/iconFlorPreta.svg" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/images/iconFlorBranca.svg" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-icon" href="/images/iconFlorPreta.svg" media="(prefers-color-scheme: dark)" />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" 
          integrity="sha512-Avb2QiuDEEvB4bZJYdft2mNjVShBftLdPG8FJ0V7irTLQ8Uo0qcPxh4Plq7G5tGm0rU+1SPhVotteLpBERwTkw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="App">
            <Header />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
