// Cloudflare R2 Storage utilities using S3-compatible API
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let r2Client: S3Client | null = null

export const getR2Client = () => {
  if (r2Client) return r2Client

  const config = useRuntimeConfig()

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  return r2Client
}

// Generate a presigned URL for uploading
export const getUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 3600 // 1 hour
): Promise<string> => {
  const config = useRuntimeConfig()
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn })
}

// Generate a presigned URL for downloading/streaming
export const getDownloadUrl = async (
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> => {
  const config = useRuntimeConfig()
  const client = getR2Client()

  const command = new GetObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

// Delete a file from R2
export const deleteFromR2 = async (key: string): Promise<void> => {
  const config = useRuntimeConfig()
  const client = getR2Client()

  const command = new DeleteObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
  })

  await client.send(command)
}

// Delete all objects under a prefix (paginated). Returns the number of
// objects deleted. Used for account deletion cleanup where per-key deletes
// would miss orphaned versions (e.g. re-uploaded avatars).
export const deleteFromR2ByPrefix = async (prefix: string): Promise<number> => {
  // All legitimate prefixes contain an entity UUID, so anything short is a
  // bug that could wipe far more than intended.
  if (!prefix || prefix.length < 20 || !prefix.includes('/')) {
    throw new Error(`Refusing to delete R2 objects with suspicious prefix: "${prefix}"`)
  }

  const config = useRuntimeConfig()
  const client = getR2Client()

  let deleted = 0
  let continuationToken: string | undefined

  do {
    const list = await client.send(new ListObjectsV2Command({
      Bucket: config.r2BucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }))

    const objects = (list.Contents || [])
      .flatMap((o) => (o.Key ? [{ Key: o.Key }] : []))

    if (objects.length > 0) {
      await client.send(new DeleteObjectsCommand({
        Bucket: config.r2BucketName,
        Delete: { Objects: objects },
      }))
      deleted += objects.length
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)

  return deleted
}

// Generate a unique key for audio files
export const generateAudioKey = (bandId: string, albumId: string, trackId: string, filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'mp3'
  return `audio/${bandId}/${albumId}/${trackId}.${extension}`
}

// Generate a unique key for cover art
export const generateCoverKey = (bandId: string, albumId: string, filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
  return `covers/${bandId}/${albumId}/cover.${extension}`
}

// Generate a unique key for artist avatar
export const generateAvatarKey = (bandId: string, filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
  return `avatars/${bandId}/avatar.${extension}`
}

// Generate a unique key for artist banner
export const generateBannerKey = (bandId: string, filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
  return `banners/${bandId}/banner.${extension}`
}
