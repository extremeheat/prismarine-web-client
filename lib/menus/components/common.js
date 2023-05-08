import { css, unsafeCSS } from 'lit'

const commonCss = css`
  ${unsafeCSS(require('../../styles/common.css'))}
  ${window.uiColorTheme === 'mc' ? unsafeCSS(require('../../styles/mc.css')) : unsafeCSS('')}
`

/** @returns {boolean} */
function isMobile () {
  const m = require('ismobilejs').default()
  return m.any
}

/**
 * @param {string} url
 */
function openURL (url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * @param {HTMLElement} prev
 * @param {HTMLElement} next
 */
function displayScreen (prev, next) {
  prev.style.display = 'none'
  next.style.display = 'block'
}

export {
  commonCss,
  isMobile,
  openURL,
  displayScreen
}
