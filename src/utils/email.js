import api from '@/utils/axios'
import { getForgotPasswordEmailTemplate, getForgotPasswordText } from '@/utils/emailTemplates'

/**
 * Sends a forgot-password email via backend
 * Backend is expected to accept POST /auth/forgot-password with { email, redirectUrl, html?, text? }
 * @param {Object} params
 * @param {string} params.email - Recipient email
 * @param {string} params.token - Reset token (if backend expects full URL from client)
 * @param {string} [params.resetBaseUrl] - Base URL for reset page (defaults to window.location origin + '/reset-password')
 * @param {string} [params.locale='en'] - Locale for template strings
 * @param {string} [params.appName='Valkku'] - Branding name
 */
export async function sendForgotPasswordEmail(params = {}) {
  const email = (params.email || '').toString().trim()
  if (!email) throw new Error('Email is required')

  const locale = (params.locale || 'en').toString()
  const appName = (params.appName || 'Valkku').toString()

  const base = params.resetBaseUrl || `${window.location.origin}/reset-password`
  const token = params.token || ''
  const resetUrl = token ? `${base}?token=${encodeURIComponent(token)}` : base

  const html = getForgotPasswordEmailTemplate({ resetUrl, appName, locale })
  const text = getForgotPasswordText({ resetUrl, appName })

  // Prefer backend rendering; include html/text as optional fallbacks
  const payload = {
    email,
    redirectUrl: resetUrl,
    html,
    text
  }

  const res = await api.post('/auth/forgot-password', payload)
  return res?.data
}
