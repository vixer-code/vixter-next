'use client'

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import './profile.css'

// Lazy load heavy components
const CreateServiceModal = lazy(() => import('@/components/CreateServiceModal'))
const CreatePackModal = lazy(() => import('@/components/CreatePackModal'))

interface Profile {
  id: string
  userId: string
  bio: string
  avatarUrl: string
  interests: string[]
  location: string
  languages: string
  hobbies: string
  aboutMe: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    username: string
    email: string
    verified: boolean
    createdAt: string
  }
}

interface Post {
  id: string
  userId: string
  content: string
  mediaId: string
  hashtags: string[]
  isAdult: boolean
  createdAt: string
  updatedAt: string
  user: {
    name: string
    username: string
    profile: {
      avatarUrl: string
    }
  }
  likes: any[]
  media?: {
    url: string
    type: string
  }
}

interface Service {
  id: string
  userId: string
  title: string
  description: string
  price: number
  category: string
  tags: string[]
  features: string[]
  complementaryOptions: any[]
  coverImageURL: string
  showcasePhotosURLs: string[]
  showcaseVideosURLs: string[]
  isActive: boolean
  isAdult: boolean
  deliveryTime: number
  mediaProcessing: any
  createdAt: string
  updatedAt: string
}

interface Pack {
  id: string
  userId: string
  title: string
  description: string
  price: number
  discount: number
  category: string
  subcategory: string
  packType: string
  features: string[]
  tags: string[]
  licenseOptions: string[]
  coverImage: string
  sampleImages: string[]
  sampleVideos: string[]
  packContent: string[]
  mediaProcessing: any
  isActive: boolean
  isAdult: boolean
  createdAt: string
  updatedAt: string
}

const Profile = () => {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const userId = params?.userId?.[0] || session?.user?.id
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')
  const [followers, setFollowers] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [reviews, setReviews] = useState([])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showCreatePackModal, setShowCreatePackModal] = useState(false)
  const [editingPack, setEditingPack] = useState<Pack | null>(null)
  
  // Services and packs state
  const [services, setServices] = useState<Service[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [packsLoading, setPacksLoading] = useState(false)
  
  // Sales dashboard states
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesError, setSalesError] = useState(null)
  const [totalVCEarned, setTotalVCEarned] = useState(0)
  const [totalSalesCount, setTotalSalesCount] = useState(0)
  const [bestSellers, setBestSellers] = useState([])
  const [topBuyers, setTopBuyers] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const isOwner = !userId || session?.user?.id === userId
  const isProvider = (profile?.user?.verified || false) // Simplified provider check

  // Load profile data
  useEffect(() => {
    if (userId) {
      loadProfileData()
    }
  }, [userId])

  // Load posts when profile tab is active
  useEffect(() => {
    if (activeTab === 'perfil' && profile) {
      loadPosts()
    }
  }, [activeTab, profile])

  // Load services when services tab is active
  useEffect(() => {
    if (activeTab === 'servicos' && profile) {
      loadServices()
    }
  }, [activeTab, profile])

  // Load packs when packs tab is active
  useEffect(() => {
    if (activeTab === 'packs' && profile) {
      loadPacks()
    }
  }, [activeTab, profile])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/posts`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const loadServices = async () => {
    try {
      setServicesLoading(true)
      const response = await fetch(`/api/users/${userId}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setServicesLoading(false)
    }
  }

  const loadPacks = async () => {
    try {
      setPacksLoading(true)
      const response = await fetch(`/api/users/${userId}/packs`)
      if (response.ok) {
        const data = await response.json()
        setPacks(data)
      }
    } catch (error) {
      console.error('Error loading packs:', error)
    } finally {
      setPacksLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0]
    if (!file || !session?.user) return

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update profile with new image URL
        await updateProfile({ [type === 'avatar' ? 'avatarUrl' : 'coverPhotoURL']: data.url })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        return true
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
    return false
  }

  const handleFollow = async () => {
    if (!session?.user || !profile) return
    
    try {
      const response = await fetch(`/api/users/${profile.userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST'
      })
      
      if (response.ok) {
        setIsFollowing(!isFollowing)
        // Update followers count
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !session?.user) return
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newPostContent,
          hashtags: extractHashtags(newPostContent)
        })
      })
      
      if (response.ok) {
        const newPost = await response.json()
        setPosts([newPost, ...posts])
        setNewPostContent('')
        setSelectedImages([])
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  const extractHashtags = (content: string) => {
    const hashtagRegex = /#[\w\u00C0-\u017F]+/g
    return content.match(hashtagRegex) || []
  }

  const formatUserDisplayName = (user: any) => {
    return user?.name || user?.username || 'Usuário'
  }

  const getUserAvatarUrl = (user: any) => {
    return user?.profile?.avatarUrl || user?.image || '/images/defpfp1.png'
  }

  // Optimized tab switching
  const handleTabClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const tabName = event.currentTarget.dataset.tab
    if (tabName && tabName !== activeTab) {
      setActiveTab(tabName)
    }
  }, [activeTab])

  // Load sales dashboard
  const loadSalesDashboard = useCallback(async () => {
    if (!session?.user || !isOwner || !isProvider) return
    setSalesLoading(true)
    setSalesError(null)
    
    // TODO: Load from actual API endpoints
    console.log('🚧 Dashboard de vendas será carregado do backend em breve!')
    
    // Mock empty data for now
    setRecentSales([])
    setBestSellers([])
    setTopBuyers([])
    setTotalVCEarned(0)
    setTotalSalesCount(0)
    setSalesLoading(false)
  }, [session?.user, isOwner, isProvider])

  // Load sales dashboard when sales tab is active
  useEffect(() => {
    if (activeTab === 'sales') {
      loadSalesDashboard()
    }
  }, [activeTab, loadSalesDashboard])

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-text">Carregando...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="error-message">Perfil não encontrado</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="cover-photo">
          <Image
            src="/images/homeImage2.png"
            alt="Cover"
            fill
            style={{ objectFit: 'cover' }}
          />
          {isOwner && (
            <div className="cover-upload">
              <input
                type="file"
                id="cover-upload"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                style={{ display: 'none' }}
              />
              <label htmlFor="cover-upload" className="upload-btn">
                <i className="fas fa-camera"></i>
              </label>
            </div>
          )}
        </div>
        
        <div className="profile-info">
          <div className="avatar-section">
            <div className="avatar-container">
              <Image
                src={getUserAvatarUrl(profile)}
                alt={formatUserDisplayName(profile.user)}
                width={120}
                height={120}
                className="avatar"
              />
              {isOwner && (
                <div className="avatar-upload">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="avatar-upload" className="upload-btn">
                    <i className="fas fa-camera"></i>
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div className="user-details">
            <h1>{formatUserDisplayName(profile.user)}</h1>
            {profile.user.username && (
              <p className="username">@{profile.user.username}</p>
            )}
            {profile.bio && (
              <p className="bio">{profile.bio}</p>
            )}
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-number">{followers.length}</span>
                <span className="stat-label">Seguidores</span>
              </div>
              <div className="stat">
                <span className="stat-number">{services.length}</span>
                <span className="stat-label">Serviços</span>
              </div>
            </div>
            
            <div className="profile-actions">
              {isOwner ? (
                <button
                  className="btn-primary"
                  onClick={() => setEditing(true)}
                >
                  <i className="fas fa-edit"></i>
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    className={`btn-follow ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollow}
                  >
                    <i className={`fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}`}></i>
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                  <button className="btn-secondary">
                    <i className="fas fa-envelope"></i>
                    Mensagem
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation */}
      <div className="profile-nav">
        <button
          className={`nav-tab ${activeTab === 'perfil' ? 'active' : ''}`}
          data-tab="perfil"
          onClick={handleTabClick}
        >
          <i className="fas fa-user"></i>
          Perfil
        </button>
        <button
          className={`nav-tab ${activeTab === 'servicos' ? 'active' : ''}`}
          data-tab="servicos"
          onClick={handleTabClick}
        >
          <i className="fas fa-briefcase"></i>
          Serviços
        </button>
        <button
          className={`nav-tab ${activeTab === 'packs' ? 'active' : ''}`}
          data-tab="packs"
          onClick={handleTabClick}
        >
          <i className="fas fa-box"></i>
          Packs
        </button>
        {isOwner && isProvider && (
          <button
            className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`}
            data-tab="sales"
            onClick={handleTabClick}
          >
            <i className="fas fa-chart-line"></i>
            Vendas
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Profile Tab */}
        {activeTab === 'perfil' && (
          <div className="profile-tab">
            {isOwner && (
              <div className="create-post">
                <div className="post-input">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="O que você está pensando?"
                    rows={3}
                  />
                </div>
                <div className="post-actions">
                  <button className="btn-secondary">
                    <i className="fas fa-image"></i>
                    Foto
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                  >
                    Publicar
                  </button>
                </div>
              </div>
            )}
            
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="no-posts">
                  <i className="fas fa-comments"></i>
                  <p>Nenhuma publicação ainda</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <div className="post-author">
                        <Image
                          src={getUserAvatarUrl(post.user)}
                          alt={formatUserDisplayName(post.user)}
                          width={40}
                          height={40}
                          className="author-avatar"
                        />
                        <div className="author-info">
                          <h4>{formatUserDisplayName(post.user)}</h4>
                          <span className="post-date">
                            {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      {isOwner && (
                        <button className="post-menu">
                          <i className="fas fa-ellipsis-h"></i>
                        </button>
                      )}
                    </div>
                    
                    <div className="post-content">
                      <p>{post.content}</p>
                      {post.media && (
                        <div className="post-media">
                          <Image
                            src={post.media.url}
                            alt="Post media"
                            width={500}
                            height={300}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="post-actions">
                      <button className="action-btn">
                        <i className="fas fa-heart"></i>
                        {post.likes.length}
                      </button>
                      <button className="action-btn">
                        <i className="fas fa-comment"></i>
                        Comentar
                      </button>
                      <button className="action-btn">
                        <i className="fas fa-share"></i>
                        Compartilhar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'servicos' && (
          <div className="services-tab">
            {isOwner && (
              <div className="tab-header">
                <h3>Meus Serviços</h3>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateServiceModal(true)}
                >
                  <i className="fas fa-plus"></i>
                  Criar Serviço
                </button>
              </div>
            )}
            
            <div className="services-grid">
              {servicesLoading ? (
                <div className="loading-text">Carregando serviços...</div>
              ) : services.length === 0 ? (
                <div className="no-services">
                  <i className="fas fa-briefcase"></i>
                  <p>Nenhum serviço encontrado</p>
                  {isOwner && (
                    <button
                      className="btn-primary"
                      onClick={() => setShowCreateServiceModal(true)}
                    >
                      Criar Primeiro Serviço
                    </button>
                  )}
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="service-card">
                    <div className="service-image">
                      <Image
                        src={service.coverImageURL || '/images/defpfp1.png'}
                        alt={service.title}
                        width={300}
                        height={200}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="service-info">
                      <h4>{service.title}</h4>
                      <p className="service-description">{service.description}</p>
                      <div className="service-price">
                        A partir de {(service.price * 1.5).toFixed(2).replace('.', ',')} VP
                      </div>
                      <div className="service-tags">
                        {service.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="service-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setEditingService(service)
                            setShowCreateServiceModal(true)
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-danger">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Packs Tab */}
        {activeTab === 'packs' && (
          <div className="packs-tab">
            {isOwner && (
              <div className="tab-header">
                <h3>Meus Packs</h3>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreatePackModal(true)}
                >
                  <i className="fas fa-plus"></i>
                  Criar Pack
                </button>
              </div>
            )}
            
            <div className="packs-grid">
              {packsLoading ? (
                <div className="loading-text">Carregando packs...</div>
              ) : packs.length === 0 ? (
                <div className="no-packs">
                  <i className="fas fa-box"></i>
                  <p>Nenhum pack encontrado</p>
                  {isOwner && (
                    <button
                      className="btn-primary"
                      onClick={() => setShowCreatePackModal(true)}
                    >
                      Criar Primeiro Pack
                    </button>
                  )}
                </div>
              ) : (
                packs.map((pack) => (
                  <div key={pack.id} className="pack-card">
                    <div className="pack-image">
                      <Image
                        src={pack.coverImage || '/images/defpfp1.png'}
                        alt={pack.title}
                        width={300}
                        height={200}
                        style={{ objectFit: 'cover' }}
                      />
                      {pack.discount > 0 && (
                        <div className="discount-badge">-{pack.discount}%</div>
                      )}
                    </div>
                    <div className="pack-info">
                      <h4>{pack.title}</h4>
                      <p className="pack-description">{pack.description}</p>
                      <div className="pack-price">
                        {pack.discount > 0 ? (
                          <>
                            <span className="original-price">
                              {(pack.price * 1.5).toFixed(2).replace('.', ',')} VP
                            </span>
                            <span className="discounted-price">
                              {((pack.price * (1 - pack.discount / 100)) * 1.5).toFixed(2).replace('.', ',')} VP
                            </span>
                          </>
                        ) : (
                          <span className="price">
                            {(pack.price * 1.5).toFixed(2).replace('.', ',')} VP
                          </span>
                        )}
                      </div>
                      <div className="pack-tags">
                        {pack.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="pack-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setEditingPack(pack)
                            setShowCreatePackModal(true)
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-danger">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && isOwner && isProvider && (
          <div className="sales-tab">
            <div className="sales-dashboard">
              <h3>Dashboard de Vendas</h3>
              {salesLoading ? (
                <div className="loading-text">Carregando dados de vendas...</div>
              ) : (
                <div className="sales-content">
                  <div className="sales-stats">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-coins"></i>
                      </div>
                      <div className="stat-info">
                        <h4>Total Ganho</h4>
                        <p>{totalVCEarned.toFixed(2)} VC</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-shopping-cart"></i>
                      </div>
                      <div className="stat-info">
                        <h4>Total de Vendas</h4>
                        <p>{totalSalesCount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sales-info">
                    <p>🚧 Dashboard de vendas completo será implementado em breve!</p>
                    <p>Aqui você poderá ver:</p>
                    <ul>
                      <li>Histórico detalhado de vendas</li>
                      <li>Produtos mais vendidos</li>
                      <li>Compradores frequentes</li>
                      <li>Análise de performance</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateServiceModal && (
        <Suspense fallback={<div>Carregando...</div>}>
          <CreateServiceModal
            isOpen={showCreateServiceModal}
            onClose={() => {
              setShowCreateServiceModal(false)
              setEditingService(null)
            }}
            onServiceCreated={() => {
              loadServices()
              setShowCreateServiceModal(false)
              setEditingService(null)
            }}
            editingService={editingService}
          />
        </Suspense>
      )}

      {showCreatePackModal && (
        <Suspense fallback={<div>Carregando...</div>}>
          <CreatePackModal
            isOpen={showCreatePackModal}
            onClose={() => {
              setShowCreatePackModal(false)
              setEditingPack(null)
            }}
            onPackCreated={() => {
              loadPacks()
              setShowCreatePackModal(false)
              setEditingPack(null)
            }}
            editingPack={editingPack}
          />
        </Suspense>
      )}
    </div>
  )
}

export default Profile
