/* eslint-disable no-plusplus */

export const replaceEmoji = (text: string) => {
  return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
}
/**
 * 分句
 * @param text
 * @returns string[]
 */
export function splitSentences(text: string) {
  const regex = /(?<=[。！？?!.\n])\s*(?=[^。！？?!.\n]|$)/

  return text
    .split(regex)
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * 字符串转 hex
 * @param str
 * @returns string
 */
export function toHex(str: string) {
  return Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * hex 转字符串
 * @param hex
 * @returns string
 */
export function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16)))
  return new TextDecoder().decode(bytes)
}
