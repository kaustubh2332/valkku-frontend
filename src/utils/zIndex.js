/**
 * Utility functions for calculating z-index based on modal depth
 */

/**
 * Calculate modal depth by traversing up the DOM tree
 * @param {HTMLElement} element - Starting element
 * @returns {number} - Number of modal containers found
 */
export function getModalDepth(element) {
  if (!element) return 0

  let depth = 0
  let currentElement = element

  while (currentElement && currentElement.parentElement) {
    currentElement = currentElement.parentElement
    if (currentElement.classList && (
      currentElement.classList.contains('v-overlay') ||
      currentElement.classList.contains('v-dialog') ||
      currentElement.classList.contains('v-bottom-sheet') ||
      currentElement.classList.contains('v-menu') ||
      currentElement.classList.contains('modal-overlay')
    )) {
      depth++
    }
  }

  return depth
}

/**
 * Calculate z-index for tooltips
 * @param {HTMLElement} element - Element to calculate for
 * @returns {number} - Calculated z-index
 */
export function getTooltipZIndex(element) {
  const baseZIndex = 30_000
  const modalDepth = getModalDepth(element)
  return baseZIndex + (modalDepth * 100) + 10_000
}

/**
 * Calculate z-index for dropdowns
 * @param {HTMLElement} element - Element to calculate for
 * @returns {number} - Calculated z-index
 */
export function getDropdownZIndex(element) {
  const baseZIndex = 30_000
  const modalDepth = getModalDepth(element)
  return baseZIndex + (modalDepth * 100) + 10_000
}

/**
 * Calculate z-index for menus
 * @param {HTMLElement} element - Element to calculate for
 * @returns {number} - Calculated z-index
 */
export function getMenuZIndex(element) {
  const baseZIndex = 30_000
  const modalDepth = getModalDepth(element)
  return baseZIndex + (modalDepth * 100) + 10_000
}
