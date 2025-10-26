/**
 * Simple HTML email templates used by the frontend when invoking backend mail endpoints.
 * Note: Most backends render their own templates server-side; this is optional helper output
 * the API may ignore. Keep assets self-contained with inline styles for best ESP compatibility.
 */

/**
 * Returns HTML for a Forgot Password email
 * @param {Object} opts
 * @param {string} opts.resetUrl - Full URL the user clicks to reset their password
 * @param {string} [opts.appName='Valkku'] - Brand/app name
 * @param {string} [opts.locale='en'] - Locale code for static strings
 */
export function getForgotPasswordEmailTemplate(opts = {}) {
  const appName = (opts.appName || 'Valkku').toString()
  const locale = (opts.locale || 'en').toString()
  const resetUrl = (opts.resetUrl || '#').toString()

  const i18n = {
    en: {
      title: 'Reset your password',
      lead: 'You requested to reset your password.',
      cta: 'Reset password',
      ignore: 'If you did not request this, you can safely ignore this email.',
      footer: 'This link will expire for your security.'
    },
    fi: {
      title: 'Vaihda salasanasi',
      lead: 'Pyysit salasanan vaihtoa.',
      cta: 'Vaihda salasana',
      ignore: 'Jos et pyytänyt tätä, voit sivuuttaa tämän viestin.',
      footer: 'Turvallisuussyistä linkki vanhenee myöhemmin.'
    }
  }

  const t = i18n[locale] || i18n.en

  const button = `
    <a href="${escapeHtml(resetUrl)}" target="_blank" style="
      display:inline-block;
      background:#1976d2;
      color:#ffffff;
      text-decoration:none;
      padding:12px 24px;
      border-radius:6px;
      font-weight:600;
      font-family:Arial, Helvetica, sans-serif;
    ">${escapeHtml(t.cta)}</a>
  `

  const html = `
  <div style="background:#f5f7fb;padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e9f0;">
      <tr>
        <td style="padding:24px 24px 8px 24px;">
          <div style="font-size:18px;font-weight:700;color:#111827;font-family:Arial, Helvetica, sans-serif;">${escapeHtml(appName)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 0 24px;">
          <div style="font-size:22px;line-height:28px;color:#111827;font-weight:700;font-family:Arial, Helvetica, sans-serif;">${escapeHtml(t.title)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 24px 0 24px;">
          <div style="font-size:14px;line-height:22px;color:#374151;font-family:Arial, Helvetica, sans-serif;">${escapeHtml(t.lead)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          ${button}
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px 24px;">
          <div style="font-size:12px;line-height:20px;color:#6b7280;font-family:Arial, Helvetica, sans-serif;">${escapeHtml(t.ignore)}<br/>${escapeHtml(t.footer)}</div>
        </td>
      </tr>
    </table>
    <div style="text-align:center;color:#9ca3af;margin-top:12px;font-size:11px;font-family:Arial, Helvetica, sans-serif;">© ${new Date().getFullYear()} ${escapeHtml(appName)}</div>
  </div>`

  return html
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Lightweight plaintext variant for providers that require it.
 */
export function getForgotPasswordText(opts = {}) {
  const appName = (opts.appName || 'Valkku').toString()
  const resetUrl = (opts.resetUrl || '#').toString()
  return `${appName}\n\nReset your password:\n${resetUrl}`
}
