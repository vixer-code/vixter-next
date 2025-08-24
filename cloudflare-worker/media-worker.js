// Cloudflare Worker for handling media access control
// Deploy this to Cloudflare Workers for presigned URL generation

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Only allow GET requests for media access
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      // Extract file path from URL
      const filePath = url.pathname.substring(1) // Remove leading slash
      
      if (!filePath) {
        return new Response('File path required', { status: 400 })
      }

      // Check if this is adult content
      const isAdultContent = filePath.startsWith('adult/')
      
      if (isAdultContent) {
        // Verify user authorization for adult content
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
          return new Response('Authorization required for adult content', { status: 401 })
        }

        // Extract and verify JWT token
        const token = authHeader.replace('Bearer ', '')
        
        try {
          // Verify JWT token (you'll need to implement this based on your NextAuth setup)
          const payload = await verifyJWT(token, env.NEXTAUTH_SECRET)
          
          if (!payload.verified) {
            return new Response('Identity verification required', { status: 403 })
          }
        } catch (error) {
          return new Response('Invalid token', { status: 401 })
        }
      }

      // Get the file from R2 bucket
      const object = await env.VIXTER_MEDIA.get(filePath)
      
      if (!object) {
        return new Response('File not found', { status: 404 })
      }
      
      // Return the file with proper headers
      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      })
      
    } catch (error) {
      console.error('Worker error:', error)
      return new Response('Internal server error', { status: 500 })
    }
  },
}

// Simple JWT verification (you'll need to adapt this to your NextAuth setup)
async function verifyJWT(token, secret) {
  // This is a simplified version - implement proper JWT verification
  // You might want to use a library like @tsndr/cloudflare-worker-jwt
  
  try {
    const [header, payload, signature] = token.split('.')
    const decodedPayload = JSON.parse(atob(payload))
    
    // Verify expiration
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      throw new Error('Token expired')
    }
    
    return decodedPayload
  } catch (error) {
    throw new Error('Invalid token format')
  }
}

// Environment variables needed:
// - R2_ACCOUNT_ID
// - R2_BUCKET_NAME  
// - NEXTAUTH_SECRET
