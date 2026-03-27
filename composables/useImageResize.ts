// Client-side image resizing to stay under serverless payload limits (e.g. Vercel 4.5MB)

export const useImageResize = () => {
  /**
   * Resize an image on the client side before uploading.
   * For square types (avatar, cover), center-crops to a square.
   * For banner type, resizes to fit the target aspect ratio.
   */
  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.85,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      // If already small enough, skip resize
      if (file.size < 2 * 1024 * 1024) {
        resolve(file)
        return
      }

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxWidth
        canvas.height = maxHeight

        const ctx = canvas.getContext('2d')!

        if (maxWidth === maxHeight) {
          // Square crop (avatar, cover)
          const size = Math.min(img.width, img.height)
          const sx = (img.width - size) / 2
          const sy = (img.height - size) / 2
          ctx.drawImage(img, sx, sy, size, size, 0, 0, maxWidth, maxHeight)
        } else {
          // Cover fit (banner)
          const scale = Math.max(maxWidth / img.width, maxHeight / img.height)
          const sw = maxWidth / scale
          const sh = maxHeight / scale
          const sx = (img.width - sw) / 2
          const sy = (img.height - sh) / 2
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxWidth, maxHeight)
        }

        URL.revokeObjectURL(img.src)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          quality,
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const resizeAvatar = (file: File) => resizeImage(file, 800, 800)
  const resizeCover = (file: File) => resizeImage(file, 1200, 1200)
  const resizeBanner = (file: File) => resizeImage(file, 1500, 500)

  return { resizeImage, resizeAvatar, resizeCover, resizeBanner }
}
