import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePresignedUploadUrl, validateFileType, validateFileSize, getFileTypeFromMimeType } from '@/lib/r2'
import { z } from 'zod'

const uploadRequestSchema = z.object({
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
    const { fileName, fileType, fileSize, isAdult } = uploadRequestSchema.parse(body)

    // Validate file type
    if (!validateFileType(fileType)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    const mediaType = getFileTypeFromMimeType(fileType)
    if (!validateFileSize(fileSize, mediaType)) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 400 }
      )
    }

    // Check if user is verified for adult content
    if (isAdult && !session.user.verified) {
      return NextResponse.json(
        { error: 'Identity verification required for adult content' },
        { status: 403 }
      )
    }

    // Generate presigned upload URL
    const uploadConfig = {
      userId: session.user.id,
      fileType,
      fileName,
      isAdult,
    }

    const { uploadUrl, key, publicUrl } = await generatePresignedUploadUrl(uploadConfig)

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      mediaType,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
