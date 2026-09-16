export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024
export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export async function validateProfileImage(file: unknown): Promise<string | null> {
  if (!(file instanceof Blob) || !file.size) return 'Choose a profile picture'
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG, or WebP image'
  if (file.size > MAX_PROFILE_IMAGE_BYTES) return 'Profile pictures must be 5 MB or smaller'
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const matches = file.type === 'image/jpeg'
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === 'image/png'
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
      : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  return matches ? null : 'This file is not a valid JPEG, PNG, or WebP image'
}
