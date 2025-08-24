import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configure R2 client (R2 is S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export interface UploadConfig {
  userId: string
  fileType: string
  fileName: string
  isAdult?: boolean
}

export async function generatePresignedUploadUrl(config: UploadConfig) {
  const { userId, fileType, fileName, isAdult = false } = config
  
  // Generate unique key with folder structure
  const timestamp = Date.now()
  const fileExtension = fileName.split('.').pop()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  const key = `${isAdult ? 'adult' : 'public'}/${userId}/${timestamp}_${sanitizedFileName}`
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
    Metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
      isAdult: isAdult.toString(),
    },
  })

  try {
    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600, // 1 hour
    })

    return {
      uploadUrl: presignedUrl,
      key,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate upload URL')
  }
}

export async function generatePresignedDownloadUrl(key: string, expiresIn: number = 3600) {
  // For adult content, we need presigned URLs for access control
  // For public content, we can use direct URLs
  
  if (key.startsWith('adult/')) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })

    try {
      const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn })
      return presignedUrl
    } catch (error) {
      console.error('Error generating presigned download URL:', error)
      throw new Error('Failed to generate download URL')
    }
  } else {
    // Public content can be accessed directly
    return `${process.env.R2_PUBLIC_URL}/${key}`
  }
}

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })

  try {
    await r2Client.send(command)
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

export function getFileTypeFromMimeType(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  return 'FILE'
}

export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Documents
    'application/pdf',
    'text/plain',
  ]
  
  return allowedTypes.includes(mimeType)
}

export function validateFileSize(size: number, type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE'): boolean {
  const maxSizes = {
    IMAGE: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 50 * 1024 * 1024, // 50MB
    FILE: 25 * 1024 * 1024, // 25MB
  }
  
  return size <= maxSizes[type]
}
