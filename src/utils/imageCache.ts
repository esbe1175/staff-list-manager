// Simple in-memory cache for base64 images
class ImageCache {
  private cache = new Map<string, string>()
  private maxSize = 50 // Limit cache size to prevent memory issues

  get(path: string): string | undefined {
    return this.cache.get(path)
  }

  set(path: string, data: string): void {
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(path, data)
  }

  has(path: string): boolean {
    return this.cache.has(path)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const imageCache = new ImageCache()