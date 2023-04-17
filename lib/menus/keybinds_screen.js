const { LitElement, html, css } = require('lit')
const { commonCss, displayScreen } = require('./components/common')

class KeyBindsScreen extends LitElement {
  static get styles () {
    return css`
      ${commonCss}
      .title {
        top: 4px;
      }

      main {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translate(-50%);
        width: 100%;
        height: calc(100% - 64px);
        place-items: center;
        background: rgba(0, 0, 0, 0.5);
        box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.7), inset 0 -3px 6px rgba(0, 0, 0, 0.7);
      }

      .keymap-list {
        width: 288px;
        display: flex;
        flex-direction: column;
        padding: 4px 0;
        overflow-y: auto;
      }

      .keymap-list::-webkit-scrollbar {
        width: 6px;
      }

      .keymap-list::-webkit-scrollbar-track {
        background: #000;
      }

      .keymap-list::-webkit-scrollbar-thumb {
        background: #ccc;
        box-shadow: inset -1px -1px 0 #4f4f4f;
      }

      .keymap-entry {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 20px;
        place-content: center;
        place-items: center;
        justify-content: space-between;
      }

      span {
        color: white;
        text-shadow: 1px 1px 0 rgb(63, 63, 63);
        font-size: 10px;
      }

      .keymap-entry-btns {
        display: flex;
        flex-direction: row;
        gap: 4px;
      }

      .bottom-btns {
        display: flex;
        flex-direction: row;
        width: 310px;
        height: 20px;
        justify-content: space-between;
        position: absolute;
        bottom: 9px;
        left: 50%;
        transform: translate(-50%);
      }

    `
  }

  static get properties () {
    return {
      keymaps: { type: Object },
      selected: { type: Number }
    }
  }

  constructor () {
    super()
    this.selected = null
    this.maps = {
      forward: { name: 'Walk Forwards', defaultKey: 'KeyW', key: 'KeyW' },
      backward: { name: 'Walk Backwards', defaultKey: 'KeyS', key: 'KeyS' },
      left: { name: 'Strafe Left', defaultKey: 'KeyA', key: 'KeyA' },
      right: { name: 'Strafe Right', defaultKey: 'KeyD', key: 'KeyD' },
      jump: { name: 'Jump', defaultKey: 'Space', key: 'Space' },
      sneak: { name: 'Sneak', defaultKey: 'ShiftLeft', key: 'ShiftLeft' },
      sprint: { name: 'Sprint', defaultKey: 'ControlLeft', key: 'ControlLeft' },
      chat: { name: 'Open Chat', defaultKey: 'KeyT', key: 'KeyT' },
      command: { name: 'Open Command', defaultKey: 'Slash', key: 'Slash' },
      drop: { name: 'Drop Item', defaultKey: 'KeyQ', key: 'KeyQ' }
    }

    document.addEventListener('keydown', (e) => {
      if (this.selected != null) {
        this.maps[this.selected].key = e.code
        this.selected = null
        this.requestUpdate()
      }
    })
    navigator.keyboard.getLayoutMap().then((keyboardLayoutMap) => {
      window.keyboardLayout = keyboardLayoutMap
      this.requestUpdate()
    })
  }

  getPhysicalCharOnKeyboard (forKey) {
    // Fixes appearance of keys on non-QWERTY keyboards
    return window.keyboardLayout?.get(forKey)?.toUpperCase() || forKey
  }

  render () {
    return html`
    <p class="title">Key Binds</p>
    <main>
      <div class="keymap-list">
        ${Object.entries(this.maps).map(([k, m]) => html`
          <div class="keymap-entry">
          <span>${m.name}</span>
          <div class="keymap-entry-btns">
            <pmui-button pmui-width="72px" fontSize=7 pmui-label="${this.selected === k ? `> ${this.getPhysicalCharOnKeyboard(m.key)} <` : this.getPhysicalCharOnKeyboard(m.key)}" @pmui-click=${e => {
              e.target.setAttribute('pmui-label', `> ${this.getPhysicalCharOnKeyboard(m.key)} <`)
              this.selected = k
              this.requestUpdate()
            }}></pmui-button>
            <pmui-button pmui-width="50px" fontSize=8 ?pmui-disabled=${m.key === m.defaultKey} pmui-label="Reset" @pmui-click=${() => {
              this.maps[k].key = this.maps[k].defaultKey
              this.requestUpdate()
              this.selected = null
            }}></pmui-button>
          </div>
        </div>
        `)}
      </div>
    </main>

    <div class="bottom-btns">
      <pmui-button pmui-width="150px" pmui-label="Reset All Keys" ?pmui-disabled=${!Object.values(this.maps).some(v => v.key !== v.defaultKey)} @pmui-click=${this.onResetAllPress}></pmui-button>
      <pmui-button pmui-width="150px" pmui-label="Done" @pmui-click=${() => displayScreen(this, document.getElementById('options-screen'))}></pmui-button>
    </div>
    `
  }

  onResetAllPress () {
    for (const key in this.maps) {
      this.maps[key].key = this.maps[key].defaultKey
    }
    this.requestUpdate()
  }
}

window.customElements.define('pmui-keybindsscreen', KeyBindsScreen)
