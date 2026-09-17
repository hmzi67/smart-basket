export const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024
export const PAYMENT_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function validatePaymentProof(file: unknown): Promise<string | null> {
  if (!(file instanceof Blob) || !file.size) return 'Upload a screenshot of your transaction'
  if (!PAYMENT_PROOF_TYPES.includes(file.type)) return 'Choose a JPEG, PNG, or WebP image'
  if (file.size > MAX_PAYMENT_PROOF_BYTES) return 'Screenshot must be 5 MB or smaller'
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const matches = file.type === 'image/jpeg'
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === 'image/png'
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
      : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  return matches ? null : 'This file is not a valid JPEG, PNG, or WebP image'
}
