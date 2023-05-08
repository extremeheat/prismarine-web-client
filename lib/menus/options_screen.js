/* eslint-disable object-property-newline, object-curly-newline */
const { LitElement, html, css } = require('lit')
const { commonCss, displayScreen, isMobile } = require('./components/common')

class OptionsScreen extends LitElement {
  static styles = css`
    ${commonCss}
    .title {
      top: 4px;
    }
    main {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: calc(100% / 6 - 6px);
      left: 50%;
      width: 310px;
      gap: 4px 0;
      place-items: center;
      place-content: center;
      transform: translate(-50%);
    }
    .wrapper {
      /* make a 2 entry width grid */
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 4px;
      width: 100%;
    }
  `

  static get properties () {
    return {
      isInsideWorld: { type: Boolean },
      mouseSensitivityX: { type: Number },
      mouseSensitivityY: { type: Number },
      chatWidth: { type: Number },
      chatHeight: { type: Number },
      chatScale: { type: Number },
      sound: { type: Number },
      renderDistance: { type: Number },
      fov: { type: Number },
      guiScale: { type: Number }
    }
  }

  constructor () {
    super()
    this.isInsideWorld = false

    const getValue = (item, defaultValue, convertFn) => window.localStorage.getItem(item) ? convertFn(window.localStorage.getItem(item)) : defaultValue

    this.mouseSensitivityX = getValue('mouseSensX', 50, (v) => Math.floor(Number(v) * 10000))
    this.mouseSensitivityY = getValue('mouseSensY', 50, (v) => Math.floor(Number(v) * 10000))
    this.chatWidth = getValue('chatWidth', 320, (v) => Number(v))
    this.chatHeight = getValue('chatHeight', 180, (v) => Number(v))
    this.chatScale = getValue('chatScale', 100, (v) => Number(v))
    this.sound = getValue('sound', 50, (v) => Number(v))
    this.renderDistance = getValue('renderDistance', 6, (v) => Number(v))
    this.fov = getValue('fov', 75, (v) => Number(v))
    this.guiScale = getValue('guiScale', 3, (v) => Number(v))
    this.forceMobileControls = getValue('forceMobileControls', false, (v) => v === 'true')
    this.theme = window.uiColorTheme

    document.documentElement.style.setProperty('--chatScale', `${this.chatScale / 100}`)
    document.documentElement.style.setProperty('--chatWidth', `${this.chatWidth}px`)
    document.documentElement.style.setProperty('--chatHeight', `${this.chatHeight}px`)
    document.documentElement.style.setProperty('--guiScale', `${this.guiScale}`)

    this.screen = options
    this.screenTitle = 'Options'
  }

  htmlForScreen = (options = this.screen) => html`${Object.entries(options).map(([key, value]) => {
    switch (value.type) {
      case 'slider': return html`
      <pmui-slider
        pmui-label="${value.label}"
        pmui-min="${value.min}"
        pmui-max="${value.max}"
        pmui-value="${this[key]}"
        pmui-unit="${value.unit || ''}"
        @input=${(e) => {
        this[key] = Number(e.target.value)
        window.localStorage.setItem(key, `${e.target.value}`)
        if (value.onUpdate) value.onUpdate(e)
      }}
      ></pmui-slider>
      `
      case 'button': return html`<pmui-button pmui-width="150px" pmui-label="${value.label}" @pmui-click=${value.onClick}></pmui-button>`
      case 'toggle': return html`<pmui-button pmui-width="150px" pmui-label="${value.label}: ${toggleValueAsStr(this[key])}" @pmui-click=${value.onClick}></pmui-button>`
      case 'group':
        return html`<pmui-button pmui-width="150px" pmui-label="${value.title}" @pmui-click=${() => {
        this.screen = value.options
        this.screenTitle = value.title
        this.requestUpdate()
        }}></pmui-button>`
      case 'input': return html`<pmui-editbox pmui-width="150px" pmui-label="${value.label}" pmui-value="${value.label}" @input=${value.onInput}></pmui-editbox>`
      default: return html``
    }
  })}`

  onDoneClick = () => {
    if (this.screen !== options) {
      this.screen = options
      this.screenTitle = 'Options'
      this.requestUpdate()
    } else {
      displayScreen(this, document.getElementById(this.isInsideWorld ? 'pause-screen' : 'title-screen'))
    }
  }

  render () {
    return html`
      <div class="bg"></div>
      <p class="title">${this.screenTitle}</p>
      <main>
        <div class="wrapper">${this.htmlForScreen()}</div>
        <pmui-button pmui-width="200px" pmui-label="Done" @pmui-click=${this.onDoneClick}></pmui-button>
      </main>
    `
  }
}

const options = {
  mouseSensitivityX: { type: 'slider', label: 'Mouse Sensitivity X', min: 1, max: 100 },
  mouseSensitivityY: { type: 'slider', label: 'Mouse Sensitivity Y', min: 1, max: 100 },
  fov: { type: 'slider', label: 'Field of View', min: 30, max: 110 },
  soundVolume: { type: 'slider', label: 'Sound Volume', min: 0, max: 100 },
  keyBinds: { type: 'button', label: 'Key Binds', onClick () {
    displayScreen(this, document.getElementById('keybinds-screen'))
  } },
  guiScale: { type: 'slider', label: 'Gui Scale', min: 1, max: 4, onUpdate (e) {
    document.documentElement.style.setProperty('--guiScale', `${e.target.value}`)
  } },
  renderDistance: { type: 'slider', label: 'Render Distance', min: 2, max: 6, unit: ' chunks' },
  chatAppearance: {
    type: 'group',
    title: 'Chat Appearance',
    options: {
      chatHeight: { type: 'slider', label: 'Chat Height', min: 0, max: 180, unit: 'px', onUpdate (e) {
        document.documentElement.style.setProperty('--chatHeight', `${e.target.value}px`)
      } },
      chatWidth: { type: 'slider', label: 'Chat Width', min: 0, max: 320, unit: 'px', onUpdate (e) {
        document.documentElement.style.setProperty('--chatHeight', `${e.target.value}px`)
      } },
      chatScale: { type: 'slider', label: 'Chat Scale', min: 0, max: 100, onUpdate (e) {
        document.documentElement.style.setProperty('--chatScale', `${e.target.value / 100}`)
      } }
    }
  },
  forceMobileControls: { type: 'toggle', label: 'Force Mobile Controls', onClick () {
    this.forceMobileControls = !this.forceMobileControls
    window.localStorage.setItem('forceMobileControls', `${this.forceMobileControls}`)
    if (this.forceMobileControls || isMobile()) {
      document.getElementById('hud').showMobileControls(true)
    } else {
      document.getElementById('hud').showMobileControls(false)
    }
    this.requestUpdate()
  } },
  theme: { type: 'toggle', label: 'UI Theme', onClick () {
    const themes = Object.keys(window.uiColorPalette)
    const nextTheme = themes[(themes.indexOf(this.theme) + 1) % themes.length]
    window.localStorage.setItem('uiTheme', `${nextTheme}`)
    window.localStorage.setItem('lastPage', 'options-screen')
    if (this.theme === 'mc' || nextTheme === 'mc') {
      // reload page
      window.location.reload()
    }
    this.theme = nextTheme
    window.setUIColorTheme(nextTheme)
    this.requestUpdate()
  } }
}

function toggleValueAsStr (val) {
  switch (val) {
    case true: return 'ON'
    case false: return 'OFF'
    default: return val.toUpperCase()
  }
}

window.customElements.define('pmui-optionsscreen', OptionsScreen)
