'use client'

import { useSession } from 'next-auth/react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

const Layout = ({ children, showHeader = true, showFooter = true }: LayoutProps) => {
  const { data: session } = useSession()

  return (
    <>
      {showHeader && <Header />}
      <main className="main-content">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  )
}

export default Layout
