import { nanoid } from 'nanoid'

/**
 * Generate a unique ID using nanoid
 * @param {number} size - Optional size of the ID (default: 21)
 * @returns {string} A unique ID
 */
export function generateId(size = 21) {
  return nanoid(size)
}

/**
 * Generate a shorter ID (useful for UI elements)
 * @returns {string} A unique 10-character ID
 */
export function generateShortId() {
  return nanoid(10)
}
