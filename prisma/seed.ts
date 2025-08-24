import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vixter.com' },
    update: {},
    create: {
      email: 'admin@vixter.com',
      name: 'Admin User',
      username: 'admin',
      password: adminPassword,
      verified: true,
      emailVerified: new Date(),
      profile: {
        create: {
          bio: 'Administrator account',
          location: 'Brazil',
        },
      },
    },
  })

  // Create test users
  const testUsers = [
    {
      email: 'alice@example.com',
      name: 'Alice Silva',
      username: 'alice_silva',
      bio: 'Content creator and digital artist',
      location: 'São Paulo, SP',
    },
    {
      email: 'bob@example.com',
      name: 'Bob Santos',
      username: 'bob_santos',
      bio: 'Photographer and video editor',
      location: 'Rio de Janeiro, RJ',
    },
    {
      email: 'carol@example.com',
      name: 'Carol Oliveira',
      username: 'carol_oliveira',
      bio: 'Social media manager',
      location: 'Belo Horizonte, MG',
    },
  ]

  for (const userData of testUsers) {
    const password = await bcrypt.hash('password123', 12)
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        username: userData.username,
        password,
        verified: false,
        profile: {
          create: {
            bio: userData.bio,
            location: userData.location,
          },
        },
      },
    })
  }

  // Create sample services
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })

  const bob = await prisma.user.findUnique({
    where: { email: 'bob@example.com' },
  })

  if (alice) {
    await prisma.service.createMany({
      data: [
        {
          userId: alice.id,
          title: 'Custom Digital Art Commission',
          description: 'I will create a custom digital artwork based on your specifications.',
          price: 150.00,
          category: 'Art & Design',
          tags: ['digital art', 'commission', 'custom'],
          deliveryTime: 7,
        },
        {
          userId: alice.id,
          title: 'Logo Design',
          description: 'Professional logo design for your business or brand.',
          price: 200.00,
          category: 'Art & Design',
          tags: ['logo', 'branding', 'design'],
          deliveryTime: 5,
        },
      ],
    })
  }

  if (bob) {
    await prisma.service.createMany({
      data: [
        {
          userId: bob.id,
          title: 'Photo Editing & Retouching',
          description: 'Professional photo editing and retouching services.',
          price: 75.00,
          category: 'Photography',
          tags: ['photo editing', 'retouching', 'photography'],
          deliveryTime: 3,
        },
        {
          userId: bob.id,
          title: 'Video Editing',
          description: 'High-quality video editing for social media and marketing.',
          price: 300.00,
          category: 'Video & Animation',
          tags: ['video editing', 'social media', 'marketing'],
          deliveryTime: 10,
        },
      ],
    })
  }

  // Create sample conversation
  if (alice && bob) {
    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [
            { userId: alice.id },
            { userId: bob.id },
          ],
        },
      },
    })

    // Create sample messages
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: alice.id,
          content: 'Hi Bob! I saw your video editing services. Could you help me with a project?',
          type: 'TEXT',
        },
        {
          conversationId: conversation.id,
          senderId: bob.id,
          content: 'Hi Alice! Absolutely, I\'d be happy to help. What kind of project are you working on?',
          type: 'TEXT',
        },
      ],
    })

    // Update conversation with last message info
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
    })

    if (lastMessage) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: lastMessage.id,
          lastMessageTime: lastMessage.createdAt,
        },
      })
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: admin@vixter.com / admin123`)
  console.log(`👤 Test users: alice@example.com, bob@example.com, carol@example.com / password123`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
