window.uiColorThemes = {}
window.uiColorPalette = {
  blueOld: {
    buttonPrimary: '#1e2148b0',
    buttonPrimaryHover: '#1e2148FB',
    editBox: '#2e2e5e94',
    editBoxBorder: '#3f3f7e85',
    editBoxBorderHover: '#c8c8e1ab',
    sliderBg: '#202042b8',
    sliderThumb: '#6565afd9',
    sliderThumbHover: '#6565af'
  },
  mc: {
    editBoxBorderHover: 'white'
  }
}
function addColorTheme (name, primaryColor) {
  window.uiColorThemes[name] = primaryColor
  window.uiColorPalette[name] = {
    baseColor: primaryColor,
    buttonPrimary: [primaryColor[0], primaryColor[1], primaryColor[2], 0.75],
    buttonPrimaryHover: [primaryColor[0], primaryColor[1], primaryColor[2], 1],
    editBox: [primaryColor[0], primaryColor[1], primaryColor[2], 0.6],
    editBoxBorder: [primaryColor[0], primaryColor[1], primaryColor[2], 0.5],
    editBoxBorderHover: [primaryColor[0] + 80, primaryColor[1] + 80, primaryColor[2] + 80, 0.8],
    sliderBg: [primaryColor[0] - 40, primaryColor[1] - 40, primaryColor[2] - 40, 0.3],
    sliderThumb: [primaryColor[0] + 40, primaryColor[1] + 40, primaryColor[2] + 40, 0.85],
    sliderThumbHover: [primaryColor[0] + 80, primaryColor[1] + 80, primaryColor[2] + 80, 1]
  }
}
addColorTheme('red', [195, 39, 39, 69])
addColorTheme('green', [70, 203, 46])
addColorTheme('magenta', [0x48, 0x1e, 0x43])
addColorTheme('blue', [0x1e, 0x21, 0x48])

window.setUIColorTheme = (theme) => {
  if (window.uiColorTheme === theme) return
  window.uiColorTheme = theme
  const root = document.querySelector(':root')
  for (const [key, value] of Object.entries(window.uiColorPalette[theme])) {
    root.style.setProperty(`--c-${key}`, typeof value === 'string' ? value : `rgba(${value.join(',')})`)
  }
}

const params = new URLSearchParams(window.location.search)
const uiTheme = params.get('theme') ?? window.localStorage.getItem('uiTheme') ?? 'blue'
window.setUIColorTheme(uiTheme)

// https://webclient.prismarine.dev/?screen=options
