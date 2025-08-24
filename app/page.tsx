import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import HomePage from './Home'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/feed')
  }

  return <HomePage />
}
