import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileTypeFromMimeType } from '@/lib/r2'
import { z } from 'zod'

const confirmUploadSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  isAdult: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { key, fileName, fileType, fileSize, isAdult } = confirmUploadSchema.parse(body)

    // Verify the key belongs to the current user
    if (!key.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Invalid file key' },
        { status: 400 }
      )
    }

    const mediaType = getFileTypeFromMimeType(fileType)
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    // Save media record to database
    const media = await prisma.media.create({
      data: {
        userId: session.user.id,
        url: publicUrl,
        type: mediaType,
        isAdult,
        filename: fileName,
        size: fileSize,
        mimeType: fileType,
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error confirming upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
