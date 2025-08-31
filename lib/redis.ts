import { createClient } from 'redis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = createClient({
  url: redisUrl,
})

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redis.on('connect', () => {
  console.log('Redis Client Connected')
})

// Connect to Redis
export async function connectRedis() {
  try {
    await redis.connect()
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
  }
}

// Disconnect from Redis
export async function disconnectRedis() {
  try {
    await redis.disconnect()
  } catch (error) {
    console.error('Failed to disconnect from Redis:', error)
  }
}

export default redis
