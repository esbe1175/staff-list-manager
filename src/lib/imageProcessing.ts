const staffImageSizePx = 512
const thumbnailImageSizePx = 128
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

async function renderSquareImage(
  image: HTMLImageElement,
  size: number,
  quality: number,
): Promise<string> {
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2)
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
  })

  if (!context) {
    throw new Error('Browseren understøtter ikke billedoptimering.')
  }

  canvas.width = size
  canvas.height = size
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
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
    renderSquareImage(image, staffImageSizePx, outputQuality),
    renderSquareImage(image, thumbnailImageSizePx, thumbnailQuality),
  ])

  return { imageDataUrl, thumbnailDataUrl }
}
