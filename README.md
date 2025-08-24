# 🚀 Vixter Next.js - Modern Social Marketplace

A complete refactor of the Vixter social media marketplace from Firebase to a modern, scalable stack.

## 🎯 Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Database**: Neon PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (email/password + Google OAuth)
- **Real-time**: Centrifugo WebSocket server
- **File Storage**: Cloudflare R2 + Workers
- **Deployment**: Vercel (frontend) + Fly.io (Centrifugo)
- **Payments**: Stripe integration
- **Identity Verification**: Mock admin panel (SERPRO planned)

## ✨ Key Features

- 🔐 **Secure Authentication** - NextAuth.js with multiple providers
- 💬 **Real-time Messaging** - Centrifugo-powered chat with typing indicators
- 📁 **Media Management** - Cloudflare R2 with access control
- 👤 **Identity Verification** - Admin panel for user verification
- 💰 **Marketplace** - Services and content packs
- 📱 **Responsive Design** - Mobile-first approach
- 🔒 **Adult Content Gating** - Verified users only
- ⚡ **High Performance** - Edge deployment and caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Neon PostgreSQL account
- Cloudflare account (for R2)

### Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd vixter-next
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp env.example .env
   # Update .env with your credentials
   ```

3. **Run setup script**:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
vixter-next/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management
│   │   ├── conversations/ # Messaging API
│   │   ├── media/         # File upload/download
│   │   └── centrifugo/    # Real-time API
│   ├── auth/              # Auth pages (signin/signup)
│   ├── (dashboard)/       # Protected app routes
│   │   ├── feed/          # Social feed
│   │   ├── messages/      # Messaging interface
│   │   ├── profile/       # User profiles
│   │   └── wallet/        # Payment system
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── providers/        # Context providers
│   └── forms/            # Form components
├── lib/                  # Core utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   ├── r2.ts             # Cloudflare R2 integration
│   └── centrifugo.ts     # Real-time messaging
├── hooks/                # Custom React hooks
│   ├── useCentrifugo.ts  # Real-time messaging hook
│   └── useMediaUpload.ts # File upload hook
├── types/                # TypeScript definitions
├── prisma/               # Database schema
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Initial data
├── docker/               # Docker configurations
│   └── centrifugo/       # Centrifugo setup
└── scripts/              # Utility scripts
```

## 🗄️ Database Schema

The Prisma schema includes:

- **Users & Profiles** - User accounts with detailed profiles
- **Conversations & Messages** - Real-time messaging system
- **Media** - File storage with access control
- **Services & Packs** - Marketplace items
- **Transactions** - Payment processing
- **Notifications** - System notifications
- **Identity Verification** - KYC system

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database

# Utilities
npm run lint         # Run ESLint
npm test             # Run tests
```

### Environment Variables

Key environment variables (see `env.example` for complete list):

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"

# Centrifugo
CENTRIFUGO_URL="ws://localhost:8000/connection/websocket"
CENTRIFUGO_API_KEY="your-api-key"
```

## 🚀 Deployment

### Vercel (Frontend)

1. **Connect repository to Vercel**
2. **Set environment variables**
3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Fly.io (Centrifugo)

1. **Install Fly CLI**
2. **Deploy**:
   ```bash
   fly launch --dockerfile docker/centrifugo/Dockerfile
   fly deploy
   ```

### Cloudflare Workers (Media)

1. **Deploy worker**:
   ```bash
   cd cloudflare-worker
   wrangler publish
   ```

## 🔄 Migration from Firebase

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific components
npm test -- --testNamePattern="Auth"

# Test API endpoints
npm run test:api
```

## 📊 Performance

- **Database**: PostgreSQL with optimized queries
- **Caching**: Redis for sessions and temporary data
- **CDN**: Cloudflare for static assets
- **Edge**: Vercel Edge Functions for API routes
- **Real-time**: Dedicated Centrifugo server

## 🔐 Security

- **Authentication**: JWT tokens with NextAuth.js
- **Authorization**: Role-based access control
- **Data Validation**: Zod schemas for all inputs
- **SQL Injection**: Prisma ORM protection
- **CSRF**: Built-in NextAuth.js protection
- **Rate Limiting**: API route protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues
- **Discussions**: Use GitHub Discussions

## 🗺️ Roadmap

- [ ] **Phase 1**: Core migration (messaging, auth, profiles)
- [ ] **Phase 2**: Marketplace features (services, payments)
- [ ] **Phase 3**: Advanced features (AI moderation, analytics)
- [ ] **Phase 4**: Mobile app (React Native)
- [ ] **Phase 5**: SERPRO integration for identity verification

## 📈 Monitoring

- **Application**: Vercel Analytics
- **Database**: Neon monitoring
- **Real-time**: Centrifugo admin panel
- **Errors**: Sentry integration (optional)

---

Built with ❤️ for the adult creator economy.
