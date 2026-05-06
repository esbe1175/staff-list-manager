const staffImageWidthPx = 384
const staffImageHeightPx = 512
const thumbnailImageWidthPx = 96
const thumbnailImageHeightPx = 128
const outputQuality = 0.86
const thumbnailQuality = 0.78

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(blob)
  })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.addEventListener('load', () => {
      URL.revokeObjectURL(url)
      resolve(image)
    })
    image.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read image: ${file.name}`))
    })
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function renderPortraitImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<string> {
  const targetRatio = width / height
  const sourceRatio = image.naturalWidth / image.naturalHeight
  const sourceWidth = sourceRatio > targetRatio
    ? image.naturalHeight * targetRatio
    : image.naturalWidth
  const sourceHeight = sourceRatio > targetRatio
    ? image.naturalHeight
    : image.naturalWidth / targetRatio
  const sourceX = Math.max(0, (image.naturalWidth - sourceWidth) / 2)
  const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) / 2)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
  })

  if (!context) {
    throw new Error('Browseren understøtter ikke billedoptimering.')
  }

  canvas.width = width
  canvas.height = height
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  )

  const webpBlob = await canvasToBlob(canvas, 'image/webp', quality)
  const outputBlob = webpBlob ?? (await canvasToBlob(canvas, 'image/jpeg', quality))

  if (!outputBlob) {
    throw new Error('Billedet kunne ikke optimeres.')
  }

  return blobToDataUrl(outputBlob)
}

export type OptimizedStaffImage = {
  imageDataUrl: string
  thumbnailDataUrl: string
}

export async function optimizeStaffImage(file: File): Promise<OptimizedStaffImage> {
  const image = await loadImage(file)
  const [imageDataUrl, thumbnailDataUrl] = await Promise.all([
    renderPortraitImage(image, staffImageWidthPx, staffImageHeightPx, outputQuality),
    renderPortraitImage(image, thumbnailImageWidthPx, thumbnailImageHeightPx, thumbnailQuality),
  ])

  return { imageDataUrl, thumbnailDataUrl }
}
