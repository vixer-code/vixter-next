import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Layout from '@/components/Layout'

export default async function FeedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">
            Bem-vindo ao seu Feed, {session.user.name || session.user.email}!
          </h1>
          
          <div className="bg-white/5 rounded-lg border border-white/10 p-6">
            <p className="text-gray-300">
              Esta é uma página placeholder para o feed. A funcionalidade real será implementada aqui.
            </p>
            
            <div className="mt-6 p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
              <h3 className="text-lg font-medium text-primary-300 mb-2">
                Em Breve
              </h3>
              <ul className="text-primary-200 space-y-1">
                <li>• Feed de posts em tempo real</li>
                <li>• Ferramentas de criação de conteúdo</li>
                <li>• Interações da comunidade</li>
                <li>• Marketplace de serviços</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
