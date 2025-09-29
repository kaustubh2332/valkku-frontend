/**
 * Universal z-index directive for tooltips and dropdowns
 * Automatically calculates appropriate z-index based on modal depth
 */
export default {
  name: 'z-index',
  mounted(el, binding) {
    applyZIndex(el, binding)
  },
  updated(el, binding) {
    applyZIndex(el, binding)
  },
  beforeUnmount(el) {
    // Clean up any applied z-index
    if (el._zIndexApplied) {
      el.style.zIndex = ''
      delete el._zIndexApplied
    }
  }
}

/**
 * Apply z-index based on the binding argument
 * @param {HTMLElement} el - Element to apply z-index to
 * @param {Object} binding - Vue directive binding
 */
function applyZIndex(el, binding) {
  const baseZIndex = 30_000
  const modalDepth = getModalDepth(el)
  const zIndex = baseZIndex + (modalDepth * 100) + 10_000

  // Store the z-index for cleanup
  el._zIndexApplied = zIndex

  if (binding.arg === 'tooltip') {
    // For tooltips, apply to the element itself
    el.style.zIndex = zIndex
  } else if (binding.arg === 'dropdown') {
    // Set CSS custom property that can be used by the component
    el.style.setProperty('--dropdown-z-index', zIndex)

    // Also apply to the element as fallback
    el.style.zIndex = zIndex

    // Use a more direct approach - find the component and update its props
    const component = el.__vue__ || el._vnode?.componentInstance
    if (component) {
      // Use Vue's reactivity system to update the component
      if (component.$props && component.$props.menuProps) {
        component.$props.menuProps.zIndex = zIndex
      } else if (component.$props) {
        component.$props.menuProps = { zIndex }
      }

      // Force the component to re-render
      if (component.$forceUpdate) {
        component.$forceUpdate()
      }
    }
  } else {
    // Default: apply to element
    el.style.zIndex = zIndex
  }
}

/**
 * Calculate modal depth by traversing up the DOM tree
 * @param {HTMLElement} element - Starting element
 * @returns {number} - Number of modal containers found
 */
function getModalDepth(element) {
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
