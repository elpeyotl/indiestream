// Image processing endpoint - resizes and crops images to square before uploading to R2
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { serverSupabaseUser } from '#supabase/server'

// Image size configurations
const IMAGE_SIZES = {
  avatar: { width: 400, height: 400 },
  cover: { width: 600, height: 600 },
  banner: { width: 1500, height: 500 },
} as const

type ImageType = keyof typeof IMAGE_SIZES

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()

  // Parse multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: 'No form data provided',
    })
  }

  // Extract file and metadata
  const fileField = formData.find(f => f.name === 'file')
  const typeField = formData.find(f => f.name === 'type')
  const keyField = formData.find(f => f.name === 'key')

  if (!fileField || !fileField.data) {
    throw createError({
      statusCode: 400,
      message: 'No file provided',
    })
  }

  const imageType = (typeField?.data?.toString() || 'avatar') as ImageType
  const customKey = keyField?.data?.toString()

  if (!IMAGE_SIZES[imageType]) {
    throw createError({
      statusCode: 400,
      message: 'Invalid image type. Must be: avatar, cover, or banner',
    })
  }

  const { width, height } = IMAGE_SIZES[imageType]

  try {
    // Process image with Sharp
    let processedImage: Buffer

    if (imageType === 'banner') {
      // For banners, resize to fit width and crop height (cover mode)
      processedImage = await sharp(fileField.data)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer()
    } else {
      // For avatars and covers, make square (crop to center)
      processedImage = await sharp(fileField.data)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toBuffer()
    }

    // Generate R2 key
    const timestamp = Date.now()
    const key = customKey || `${imageType}s/${user.id}/${timestamp}.jpg`

    // Initialize S3 client for R2
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
      },
    })

    // Upload to R2
    await s3.send(
      new PutObjectCommand({
        Bucket: config.r2BucketName,
        Key: key,
        Body: processedImage,
        ContentType: 'image/jpeg',
      })
    )

    return {
      success: true,
      key,
      size: processedImage.length,
      dimensions: { width, height },
    }
  } catch (error: any) {
    console.error('Image processing error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to process image',
    })
  }
})
