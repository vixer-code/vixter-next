'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import './wallet.css'

interface WalletData {
  vpBalance: number
  vcBalance: number
  vbpBalance: number
  vcPendingBalance: number
}

interface Transaction {
  id: string
  amount: number
  currency: string
  type: string
  status: string
  description: string
  createdAt: string
}

const Wallet = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [wallet, setWallet] = useState<WalletData>({
    vpBalance: 0,
    vcBalance: 0,
    vbpBalance: 0,
    vcPendingBalance: 0
  })
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [activeTab, setActiveTab] = useState('transactions')
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState({
    currency: 'all',
    type: 'all',
    period: '7days'
  })
  
  // Modal states
  const [showBuyVPModal, setShowBuyVPModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card')
  
  // Form states
  const [sendForm, setSendForm] = useState({
    username: '',
    amount: '',
    message: ''
  })
  const [redeemCode, setRedeemCode] = useState('')
  
  const TRANSACTIONS_PER_PAGE = 10

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Load wallet data
  useEffect(() => {
    if (session?.user) {
      loadWalletData()
      loadTransactions()
    }
  }, [session])

  // Apply filters
  useEffect(() => {
    applyFilters()
    setCurrentPage(1)
  }, [transactions, filters])

  const loadWalletData = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setWallet(data)
      }
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/wallet/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]
    
    // Filter by currency
    if (filters.currency !== 'all') {
      filtered = filtered.filter(t => t.currency === filters.currency)
    }
    
    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type)
    }
    
    // Filter by period
    const now = new Date()
    const periodDays = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': null
    }
    
    const days = periodDays[filters.period as keyof typeof periodDays]
    if (days) {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(t => new Date(t.createdAt) >= cutoff)
    }
    
    setFilteredTransactions(filtered)
  }

  const canClaimDailyBonus = () => {
    // TODO: Implement daily bonus logic
    return true
  }

  const claimDaily = async () => {
    try {
      const response = await fetch('/api/wallet/daily-bonus', {
        method: 'POST'
      })
      if (response.ok) {
        loadWalletData()
        loadTransactions()
      }
    } catch (error) {
      console.error('Error claiming daily bonus:', error)
    }
  }

  const buyVP = async (packageData: any) => {
    setProcessingPayment(true)
    try {
      const response = await fetch('/api/wallet/buy-vp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: packageData.vp,
          paymentMethod: selectedPaymentMethod
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Handle Stripe checkout or other payment flow
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      }
    } catch (error) {
      console.error('Error buying VP:', error)
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleRedeemCode = async () => {
    try {
      const response = await fetch('/api/wallet/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: redeemCode })
      })
      
      if (response.ok) {
        setRedeemCode('')
        setShowRedeemModal(false)
        loadWalletData()
        loadTransactions()
      }
    } catch (error) {
      console.error('Error redeeming code:', error)
    }
  }

  const formatCurrency = (amount: number, currency: string = '') => {
    return parseFloat(amount.toString()).toFixed(2).replace('.', ',')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method)
  }

  // VP Packages
  const vpPackages = [
    { vp: 100, price: 9.99, bonus: 0, popular: false },
    { vp: 250, price: 24.99, bonus: 25, popular: false },
    { vp: 500, price: 49.99, bonus: 75, popular: true },
    { vp: 1000, price: 89.99, bonus: 200, popular: false },
    { vp: 2500, price: 199.99, bonus: 600, popular: false }
  ]

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE
    return filteredTransactions.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE)
  }, [filteredTransactions, currentPage])

  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE)

  if (status === 'loading' || loading) {
    return (
      <div className="wallet-container">
        <div className="loading-text">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="wallet-container">
      {/* Wallet Header - Currency Cards */}
      <div className="wallet-header">
        {/* VP Balance Card */}
        <div className="balance-card vp-card">
          <div className="vp-token">
            <svg className="vp-token-large" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow-large" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <linearGradient id="hexGradient-large" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1A0A2E" />
                  <stop offset="100%" stopColor="#2E1A4A" />
                </linearGradient>
                
                <radialGradient id="glowGradient-large" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#8A2BE2" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#8A2BE2" stopOpacity="0" />
                </radialGradient>
                
                <linearGradient id="textGradient-large" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B14AFF" />
                  <stop offset="100%" stopColor="#00FFCA" />
                </linearGradient>
              </defs>
              
              <circle cx="64" cy="64" r="60" fill="url(#glowGradient-large)" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="url(#hexGradient-large)" 
                    stroke="#8A2BE2" 
                    strokeWidth="2" 
                    filter="url(#glow-large)" />
              
              <g transform="translate(64, 64)">
                <text x="0" y="-8" 
                      textAnchor="middle" 
                      fontSize="20" 
                      fill="url(#textGradient-large)"
                      fontWeight="bold">VP</text>
                <text x="0" y="12" 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="url(#textGradient-large)"
                      fontWeight="bold">POINTS</text>
              </g>
              
              <path d="M40 60 H28 V70 H36" fill="none" stroke="#8A2BE2" strokeWidth="1" />
              <path d="M88 60 H100 V70 H92" fill="none" stroke="#8A2BE2" strokeWidth="1" />
              <path d="M64 32 V24" fill="none" stroke="#8A2BE2" strokeWidth="1" />
              <path d="M64 96 V104" fill="none" stroke="#8A2BE2" strokeWidth="1" />
              
              <circle cx="28" cy="60" r="2" fill="#8A2BE2" />
              <circle cx="36" cy="70" r="2" fill="#8A2BE2" />
              <circle cx="100" cy="60" r="2" fill="#8A2BE2" />
              <circle cx="92" cy="70" r="2" fill="#8A2BE2" />
              <circle cx="64" cy="24" r="2" fill="#8A2BE2" />
              <circle cx="64" cy="104" r="2" fill="#8A2BE2" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="none" 
                    stroke="#B14AFF" 
                    strokeWidth="1" 
                    opacity="0.5">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1;3;1" dur="3s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
          <div className="balance-info">
            <h2>Vixter Points</h2>
            <p className="balance-description">Moeda premium para compras na plataforma</p>
            <div className="balance-amount">
              <span id="wallet-vp-amount">{formatCurrency(wallet.vpBalance)}</span>
              <span className="currency">VP</span>
            </div>
            <button 
              className="btn-action"
              onClick={() => setShowBuyVPModal(true)}
            >
              <i className="fas fa-plus"></i> Comprar VP
            </button>
          </div>
        </div>

        {/* VBP Balance Card */}
        <div className="balance-card vbp-card">
          <div className="vbp-token">
            <svg className="vbp-token-large" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow-large-vbp" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <linearGradient id="hexGradient-large-vbp" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2A1A0A" />
                  <stop offset="100%" stopColor="#4A2E1A" />
                </linearGradient>
                
                <radialGradient id="glowGradient-large-vbp" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                </radialGradient>
                
                <linearGradient id="textGradient-large-vbp" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFA500" />
                </linearGradient>
              </defs>
              
              <circle cx="64" cy="64" r="60" fill="url(#glowGradient-large-vbp)" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="url(#hexGradient-large-vbp)" 
                    stroke="#FFD700" 
                    strokeWidth="2" 
                    filter="url(#glow-large-vbp)" />
              
              <g transform="translate(64, 64)">
                <text x="0" y="-8" 
                      textAnchor="middle" 
                      fontSize="18" 
                      fill="url(#textGradient-large-vbp)"
                      fontWeight="bold">VBP</text>
                <text x="0" y="12" 
                      textAnchor="middle" 
                      fontSize="8" 
                      fill="url(#textGradient-large-vbp)"
                      fontWeight="bold">BONUS</text>
              </g>
              
              <path d="M40 60 H28 V70 H36" fill="none" stroke="#FFD700" strokeWidth="1" />
              <path d="M88 60 H100 V70 H92" fill="none" stroke="#FFD700" strokeWidth="1" />
              <path d="M64 32 V24" fill="none" stroke="#FFD700" strokeWidth="1" />
              <path d="M64 96 V104" fill="none" stroke="#FFD700" strokeWidth="1" />
              
              <circle cx="28" cy="60" r="2" fill="#FFD700" />
              <circle cx="36" cy="70" r="2" fill="#FFD700" />
              <circle cx="100" cy="60" r="2" fill="#FFD700" />
              <circle cx="92" cy="70" r="2" fill="#FFD700" />
              <circle cx="64" cy="24" r="2" fill="#FFD700" />
              <circle cx="64" cy="104" r="2" fill="#FFD700" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="none" 
                    stroke="#FFA500" 
                    strokeWidth="1" 
                    opacity="0.5">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1;3;1" dur="3s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
          <div className="balance-info">
            <h2>Vixter Bonus Points</h2>
            <p className="balance-description">Ganhos através de atividades na plataforma</p>
            <div className="balance-amount">
              <span id="wallet-vbp-amount">{formatCurrency(wallet.vbpBalance)}</span>
              <span className="currency">VBP</span>
            </div>
            <button 
              className={`btn-claim ${!canClaimDailyBonus() ? 'claimed' : ''}`}
              onClick={claimDaily}
              disabled={!canClaimDailyBonus()}
            >
              <i className="fas fa-gift"></i> {canClaimDailyBonus() ? 'Resgatar Diário' : 'Já Resgatado'}
            </button>
            <small className="vbp-info">Ganhe VBP através de login diário, referências e desafios!</small>
          </div>
        </div>

        {/* VC Balance Card */}
        <div className="balance-card vc-card">
          <div className="vc-token">
            <svg className="vc-token-large" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow-large-vc" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <linearGradient id="hexGradient-large-vc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A1F0A" />
                  <stop offset="100%" stopColor="#1A2E1A" />
                </linearGradient>
                
                <radialGradient id="glowGradient-large-vc" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#00C853" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
                </radialGradient>
                
                <linearGradient id="textGradient-large-vc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4CAF50" />
                  <stop offset="100%" stopColor="#00C853" />
                </linearGradient>
              </defs>
              
              <circle cx="64" cy="64" r="60" fill="url(#glowGradient-large-vc)" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="url(#hexGradient-large-vc)" 
                    stroke="#4CAF50" 
                    strokeWidth="2" 
                    filter="url(#glow-large-vc)" />
              
              <g transform="translate(64, 64)">
                <text x="0" y="-8" 
                      textAnchor="middle" 
                      fontSize="20" 
                      fill="url(#textGradient-large-vc)"
                      fontWeight="bold">VC</text>
                <text x="0" y="12" 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="url(#textGradient-large-vc)"
                      fontWeight="bold">CREDITS</text>
              </g>
              
              <path d="M40 60 H28 V70 H36" fill="none" stroke="#4CAF50" strokeWidth="1" />
              <path d="M88 60 H100 V70 H92" fill="none" stroke="#4CAF50" strokeWidth="1" />
              <path d="M64 32 V24" fill="none" stroke="#4CAF50" strokeWidth="1" />
              <path d="M64 96 V104" fill="none" stroke="#4CAF50" strokeWidth="1" />
              
              <circle cx="28" cy="60" r="2" fill="#4CAF50" />
              <circle cx="36" cy="70" r="2" fill="#4CAF50" />
              <circle cx="100" cy="60" r="2" fill="#4CAF50" />
              <circle cx="92" cy="70" r="2" fill="#4CAF50" />
              <circle cx="64" cy="24" r="2" fill="#4CAF50" />
              <circle cx="64" cy="104" r="2" fill="#4CAF50" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="none" 
                    stroke="#A5D6A7" 
                    strokeWidth="1" 
                    opacity="0.5">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1;3;1" dur="3s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
          <div className="balance-info">
            <h2>Vixter Credits</h2>
            <p className="balance-description">Ganhos através de serviços prestados</p>
            <div className="balance-amount">
              <span id="wallet-vc-amount">{formatCurrency(wallet.vcBalance)}</span>
              <span className="currency">VC</span>
            </div>
            <button 
              className="btn-action"
              onClick={() => setShowSendModal(true)}
            >
              <i className="fas fa-paper-plane"></i> Enviar VC
            </button>
          </div>
        </div>

        {/* VC Pending Balance Card */}
        <div className="balance-card vc-pending-card">
          <div className="vc-pending-token">
            <svg className="vc-pending-token-large" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow-large-vc-pending" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <linearGradient id="hexGradient-large-vc-pending" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2A1A0A" />
                  <stop offset="100%" stopColor="#4A2E1A" />
                </linearGradient>
                
                <radialGradient id="glowGradient-large-vc-pending" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#FFB74D" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#FFB74D" stopOpacity="0" />
                </radialGradient>
                
                <linearGradient id="textGradient-large-vc-pending" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFB74D" />
                  <stop offset="100%" stopColor="#FFC107" />
                </linearGradient>
              </defs>
              
              <circle cx="64" cy="64" r="60" fill="url(#glowGradient-large-vc-pending)" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="url(#hexGradient-large-vc-pending)" 
                    stroke="#FFB74D" 
                    strokeWidth="2" 
                    filter="url(#glow-large-vc-pending)" />
              
              <g transform="translate(64, 64)">
                <text x="0" y="-8" 
                      textAnchor="middle" 
                      fontSize="18" 
                      fill="url(#textGradient-large-vc-pending)"
                      fontWeight="bold">VC</text>
                <text x="0" y="12" 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="url(#textGradient-large-vc-pending)"
                      fontWeight="bold">PEND</text>
              </g>
              
              <path d="M40 60 H28 V70 H36" fill="none" stroke="#FFB74D" strokeWidth="1" />
              <path d="M88 60 H100 V70 H92" fill="none" stroke="#FFB74D" strokeWidth="1" />
              <path d="M64 32 V24" fill="none" stroke="#FFB74D" strokeWidth="1" />
              <path d="M64 96 V104" fill="none" stroke="#FFB74D" strokeWidth="1" />
              
              <circle cx="28" cy="60" r="2" fill="#FFB74D" />
              <circle cx="36" cy="70" r="2" fill="#FFB74D" />
              <circle cx="100" cy="60" r="2" fill="#FFB74D" />
              <circle cx="92" cy="70" r="2" fill="#FFB74D" />
              <circle cx="64" cy="24" r="2" fill="#FFB74D" />
              <circle cx="64" cy="104" r="2" fill="#FFB74D" />
              
              <path d="M64 14 L110 40 L110 88 L64 114 L18 88 L18 40 Z" 
                    fill="none" 
                    stroke="#FFC107" 
                    strokeWidth="1" 
                    opacity="0.5">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1;3;1" dur="3s" repeatCount="indefinite" />
              </path>
              
              {/* Clock icon for pending status */}
              <circle cx="90" cy="38" r="8" fill="#FF5722" opacity="0.9" />
              <path d="M90 34 L90 38 L93 41" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div className="balance-info">
            <h2>VC Pendente</h2>
            <p className="balance-description">Aguardando confirmação de serviços</p>
            <div className="balance-amount">
              <span id="wallet-vc-pending-amount">{formatCurrency(wallet.vcPendingBalance)}</span>
              <span className="currency">VC</span>
            </div>
            <button 
              className="btn-warning small"
              disabled
            >
              <i className="fas fa-clock"></i> Aguardando
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Content */}
      <div className="wallet-content">
        {/* Tab Navigation */}
        <div className="wallet-tabs">
          <button 
            className={`wallet-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="fas fa-list"></i>
            Transações
          </button>
          <button 
            className={`wallet-tab ${activeTab === 'earning' ? 'active' : ''}`}
            onClick={() => setActiveTab('earning')}
          >
            <i className="fas fa-coins"></i>
            Ganhar Moedas
          </button>
          <button 
            className={`wallet-tab ${activeTab === 'redeem' ? 'active' : ''}`}
            onClick={() => setActiveTab('redeem')}
          >
            <i className="fas fa-gift"></i>
            Resgatar Código
          </button>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="transactions-section">
            <div className="transactions-header">
              <h3>Histórico de Transações</h3>
              <div className="transactions-filters">
                <select 
                  value={filters.currency} 
                  onChange={(e) => setFilters({...filters, currency: e.target.value})}
                >
                  <option value="all">Todas as Moedas</option>
                  <option value="VP">VP</option>
                  <option value="VC">VC</option>
                  <option value="VBP">VBP</option>
                </select>
                <select 
                  value={filters.type} 
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="DEPOSIT">Depósito</option>
                  <option value="WITHDRAWAL">Saque</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="SERVICE_PAYMENT">Pagamento de Serviço</option>
                  <option value="PACK_PURCHASE">Compra de Pack</option>
                </select>
                <select 
                  value={filters.period} 
                  onChange={(e) => setFilters({...filters, period: e.target.value})}
                >
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias</option>
                  <option value="90days">Últimos 90 dias</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>

            <div className="transactions-list">
              {paginatedTransactions.length === 0 ? (
                <div className="no-transactions">
                  <i className="fas fa-receipt"></i>
                  <p>Nenhuma transação encontrada</p>
                </div>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      <i className={`fas ${
                        transaction.type === 'DEPOSIT' ? 'fa-plus' :
                        transaction.type === 'WITHDRAWAL' ? 'fa-minus' :
                        transaction.type === 'TRANSFER' ? 'fa-exchange-alt' :
                        'fa-shopping-cart'
                      }`}></i>
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-description">{transaction.description}</div>
                      <div className="transaction-date">{formatDate(transaction.createdAt)}</div>
                    </div>
                    <div className="transaction-amount">
                      <span className={`amount ${transaction.type === 'DEPOSIT' || transaction.type === 'VC_EARNING' ? 'positive' : 'negative'}`}>
                        {transaction.type === 'DEPOSIT' || transaction.type === 'VC_EARNING' ? '+' : '-'}
                        {formatCurrency(transaction.amount)} {transaction.currency}
                      </span>
                      <div className={`status ${transaction.status.toLowerCase()}`}>
                        {transaction.status === 'COMPLETED' ? 'Concluído' :
                         transaction.status === 'PENDING' ? 'Pendente' :
                         transaction.status === 'FAILED' ? 'Falhou' : transaction.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span>{currentPage} de {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Earning Tab */}
        {activeTab === 'earning' && (
          <div className="earning-section">
            <div className="earning-methods">
              <div className="earning-card vp-earning">
                <div className="earning-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="earning-info">
                  <h3>Login Diário</h3>
                  <p>Faça login todos os dias e ganhe VBP grátis! Mantenha sua sequência para ganhar bônus extras.</p>
                  <div className="earning-amount">+10 VBP</div>
                </div>
                <div className="currency-tag">VBP</div>
              </div>

              <div className="earning-card vbp-earning">
                <div className="earning-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="earning-info">
                  <h3>Indicar Amigos</h3>
                  <p>Convide seus amigos para a Vixter e ganhe VBP quando eles se cadastrarem e fizerem sua primeira compra.</p>
                  <div className="earning-amount">+50 VBP</div>
                </div>
                <div className="currency-tag">VBP</div>
              </div>

              <div className="earning-card vp-earning">
                <div className="earning-icon">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div className="earning-info">
                  <h3>Prestar Serviços</h3>
                  <p>Ofereça seus serviços na plataforma e ganhe VC por cada serviço concluído com sucesso.</p>
                  <div className="earning-amount">Variável</div>
                </div>
                <div className="currency-tag">VC</div>
              </div>
            </div>
          </div>
        )}

        {/* Redeem Tab */}
        {activeTab === 'redeem' && (
          <div className="redeem-section">
            <div className="redeem-card">
              <div className="redeem-header">
                <h3>Resgatar Código</h3>
                <p>Digite seu código de resgate para adicionar VP ou VBP à sua carteira</p>
              </div>
              <div className="redeem-form">
                <div className="form-group">
                  <label>Código de Resgate</label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
                      let formattedValue = ''
                      
                      for (let i = 0; i < value.length; i++) {
                        if (i > 0 && i % 4 === 0) {
                          formattedValue += '-'
                        }
                        formattedValue += value[i]
                      }
                      
                      setRedeemCode(formattedValue.substring(0, 19))
                    }}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    maxLength={19}
                  />
                  <small>Códigos podem resgatar VP ou VBP, dependendo do tipo de código.</small>
                </div>
                <button 
                  className="btn-primary"
                  onClick={handleRedeemCode}
                  disabled={redeemCode.length < 19}
                >
                  Resgatar Código
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buy VP Modal */}
      {showBuyVPModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Comprar Vixter Points</h3>
              <button 
                className="close-btn"
                onClick={() => setShowBuyVPModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <div className="vp-packages">
                <h4>Escolha seu pacote</h4>
                <div className="packages-grid">
                  {vpPackages.map((pkg, index) => (
                    <button
                      key={index}
                      className={`package-card ${pkg.popular ? 'popular' : ''} ${selectedPackage?.vp === pkg.vp ? 'selected' : ''}`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      {pkg.popular && <div className="popular-badge">Mais Popular</div>}
                      <div className="package-vp">{pkg.vp} VP</div>
                      {pkg.bonus > 0 && <div className="package-bonus">+{pkg.bonus} Bônus</div>}
                      <div className="package-price">R$ {pkg.price.toFixed(2)}</div>
                      <div className="package-total">
                        Total: {pkg.vp + pkg.bonus} VP
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="payment-methods">
                  <h3>Métodos de Pagamento</h3>
                  <div className="payment-options">
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="credit-card" 
                        checked={selectedPaymentMethod === 'credit-card'}
                        onChange={() => handlePaymentMethodChange('credit-card')}
                      />
                      <div className="option-content">
                        <i className="fas fa-credit-card"></i>
                        <span>Cartão de Crédito</span>
                      </div>
                    </label>
                    
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="pix" 
                        checked={selectedPaymentMethod === 'pix'}
                        onChange={() => handlePaymentMethodChange('pix')}
                      />
                      <div className="option-content">
                        <i className="fas fa-qrcode"></i>
                        <span>PIX</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowBuyVPModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={() => selectedPackage && buyVP(selectedPackage)}
                disabled={!selectedPackage || processingPayment}
              >
                {processingPayment ? 'Processando...' : `Comprar ${selectedPackage?.vp || 0} VP`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send VC Modal */}
      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Enviar VC</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSendModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Usuário de Destino</label>
                <input
                  type="text"
                  value={sendForm.username}
                  onChange={(e) => setSendForm({...sendForm, username: e.target.value})}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div className="form-group">
                <label>Quantidade (VC)</label>
                <input
                  type="number"
                  value={sendForm.amount}
                  onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                  placeholder="0.00"
                  min="1"
                  max={wallet.vcBalance}
                />
                <small>Saldo disponível: {formatCurrency(wallet.vcBalance)} VC</small>
              </div>
              <div className="form-group">
                <label>Mensagem (opcional)</label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm({...sendForm, message: e.target.value})}
                  placeholder="Digite uma mensagem..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowSendModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                disabled={!sendForm.username || !sendForm.amount || parseFloat(sendForm.amount) <= 0}
              >
                Enviar VC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
