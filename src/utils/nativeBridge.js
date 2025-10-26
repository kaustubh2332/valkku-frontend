/**
 * React Native WebView bridge helpers.
 *
 * Usage:
 *  import { triggerHaptic, sendToNative } from '@/utils/nativeBridge'
 *  triggerHaptic('light')
 *  sendToNative('someAction', { foo: 'bar' })
 */

/**
 * Low-level postMessage wrapper that tries both window and document WebView bridges.
 * Returns true if a postMessage was attempted successfully.
 * @param {Record<string, any>} payload
 * @returns {boolean}
 */
export function postToWebview(payload = {}) {
  let posted = false
  try {
    const msg = JSON.stringify(payload)
    if (typeof window !== 'undefined' && window?.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(msg)
      posted = true
    }
    if (!posted && typeof document !== 'undefined' && (document)?.ReactNativeWebView?.postMessage) {
      document.ReactNativeWebView.postMessage(msg)
      posted = true
    }
  } catch (error) {
    // Swallow errors to avoid breaking web flows when not embedded in RN
    // console.debug('postToWebview error', error)
  }
  return posted
}

/**
 * Higher-level sender that adds an action field and merges additional data.
 * @param {string} action
 * @param {Record<string, any>} [data]
 */
export function sendToNative(action, data = {}) {
  if (!action) return false
  return postToWebview({ action, ...data })
}

/**
 * Triggers a haptic feedback on the native host (if supported).
 * Types: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'
 * @param {string} type
 */
export function triggerHaptic(type) {
  return sendToNative('haptic', { type })
}
