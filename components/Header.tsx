'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import './Header.css'

const Header = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleVpBalanceClick = () => {
    if (session) {
      router.push('/wallet')
    }
  }

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Remove focus from the button to prevent stuck hover/active states
    if (e.target) {
      (e.target as HTMLElement).blur()
    }
    
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setMobileMenuOpen(false)
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <>
      <header>
        <nav>
          <Link href="/" className="logo">
            <img src="/images/Flor-Colorida.png" alt="Vixter logo" className="logo-icon" fetchPriority="high" />
            <span>Vixter</span>
          </Link>

          <ul className="nav-links">
            <li><Link href="/vixies" className={isActive('/vixies') ? 'active' : ''}>Vixies</Link></li>
            <li><Link href="/vixink" className={isActive('/vixink') ? 'active' : ''}>Vixink</Link></li>
            <li><Link href="/feed" className={isActive('/feed') ? 'active' : ''}>Comunidade</Link></li>
            {session && (
              <li><Link href="/messages" className={isActive('/messages') ? 'active' : ''}>Mensagens</Link></li>
            )}
            
            {!session ? (
              <>
                <li className="auth-hide logged-out"><Link href="/auth/signin">Entrar</Link></li>
                <li className="auth-hide logged-out"><Link href="/auth/signup">Registrar</Link></li>
              </>
            ) : (
              <>
                {/* VP Balance Display */}
                <li className="auth-hide logged-in">
                  <div className="vp-balance" onClick={handleVpBalanceClick}>
                    <svg className="vp-icon" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <filter id="header-glow" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        
                        <linearGradient id="header-hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0F0F1A" />
                          <stop offset="100%" stopColor="#1A1A2E" />
                        </linearGradient>
                        
                        <radialGradient id="header-glowGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#8A2BE2" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#8A2BE2" stopOpacity="0" />
                        </radialGradient>
                        
                        <linearGradient id="header-textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00FFCA" />
                          <stop offset="100%" stopColor="#00D4AA" />
                        </linearGradient>
                      </defs>
                      
                      <circle cx="64" cy="64" r="56" fill="url(#header-glowGradient)" filter="url(#header-glow)" />
                      
                      <polygon 
                        points="64,12 96,32 96,64 64,84 32,64 32,32" 
                        fill="url(#header-hexGradient)" 
                        stroke="#8A2BE2" 
                        strokeWidth="2"
                        filter="url(#header-glow)"
                      />
                      
                      <text x="64" y="70" textAnchor="middle" fontSize="20" fontWeight="bold" fill="url(#header-textGradient)">
                        VP
                      </text>
                    </svg>
                    <span className="vp-amount">0</span>
                  </div>
                </li>
                
                {/* User Profile */}
                <li className="auth-hide logged-in">
                  <div className="user-profile">
                    <img 
                      src="/images/defpfp1.png" 
                      alt="Profile" 
                      className="profile-avatar"
                    />
                    <span className="username">{session.user?.name || session.user?.email}</span>
                    <div className="user-menu">
                      <Link href="/profile">Perfil</Link>
                      <Link href="/settings">Configurações</Link>
                      <button onClick={handleLogout}>Sair</button>
                    </div>
                  </div>
                </li>
              </>
            )}
          </ul>

          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </nav>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={closeMobileMenu}>
          <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <Link href="/" className="logo" onClick={closeMobileMenu}>
                <img src="/images/Flor-Colorida.png" alt="Vixter logo" className="logo-icon" />
                <span>Vixter</span>
              </Link>
              <button className="mobile-close-btn" onClick={closeMobileMenu}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <ul className="mobile-nav-links">
              <li><Link href="/vixies" onClick={closeMobileMenu}>Vixies</Link></li>
              <li><Link href="/vixink" onClick={closeMobileMenu}>Vixink</Link></li>
              <li><Link href="/feed" onClick={closeMobileMenu}>Comunidade</Link></li>
              {session && (
                <li><Link href="/messages" onClick={closeMobileMenu}>Mensagens</Link></li>
              )}
              
              {!session ? (
                <>
                  <li><Link href="/auth/signin" onClick={closeMobileMenu}>Entrar</Link></li>
                  <li><Link href="/auth/signup" onClick={closeMobileMenu}>Registrar</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/profile" onClick={closeMobileMenu}>Perfil</Link></li>
                  <li><Link href="/settings" onClick={closeMobileMenu}>Configurações</Link></li>
                  <li><Link href="/wallet" onClick={closeMobileMenu}>Carteira</Link></li>
                  <li><button onClick={handleLogout} className="logout-btn">Sair</button></li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}

export default Header
