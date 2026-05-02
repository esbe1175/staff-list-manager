const imageExtensionPattern = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i

export function nameFromFilename(filename: string): string {
  const lastPathPart = filename.split(/[\\/]/).pop() ?? filename
  const withoutExtension = lastPathPart.replace(imageExtensionPattern, '')
  const withoutNumericSuffix = withoutExtension.replace(/\s*\(\d+\)\s*$/, '')

  return withoutNumericSuffix
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
