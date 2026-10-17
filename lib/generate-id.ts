// Gera um ID curto e único para cada QR Code
// Usa apenas caracteres fáceis de ler (sem 0, O, I, l)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export function generateId(length = 8): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((byte) => CHARS[byte % CHARS.length])
    .join('')
}
