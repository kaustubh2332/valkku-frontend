import { computed, getCurrentInstance } from 'vue'

/**
 * Composable for calculating z-index based on modal depth
 * @returns {Object} - Z-index utilities
 */
export function useZIndex() {
  const instance = getCurrentInstance()

  /**
   * Calculate z-index based on modal depth
   * @param {number} offset - Additional offset to add (default: 10_000)
   * @returns {number} - Calculated z-index
   */
  const calculateZIndex = (offset = 10_000) => {
    const baseZIndex = 30_000
    const modalDepth = getModalDepth(instance?.proxy?.$el)
    return baseZIndex + (modalDepth * 100) + offset
  }

  /**
   * Computed z-index for tooltips
   */
  const tooltipZIndex = computed(() => calculateZIndex(10_000))

  /**
   * Computed z-index for dropdowns
   */
  const dropdownZIndex = computed(() => calculateZIndex(10_000))

  /**
   * Computed z-index for menus
   */
  const menuZIndex = computed(() => calculateZIndex(10_000))

  return {
    calculateZIndex,
    tooltipZIndex,
    dropdownZIndex,
    menuZIndex
  }
}

/**
 * Calculate modal depth by traversing up the DOM tree
 * @param {HTMLElement} element - Starting element
 * @returns {number} - Number of modal containers found
 */
function getModalDepth(element) {
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
