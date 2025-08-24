import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username?: string
      verified: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    username?: string
    verified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    username?: string
    verified: boolean
  }
}
